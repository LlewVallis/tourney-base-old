import { JSONSchemaType } from "ajv";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { UserInfo } from "../auth";
import { getUserInfo } from "./auth";
import rateLimit from "./rate-limiter";
import validate from "./validate";

export function post<I, O>(
  schema: JSONSchemaType<I>,
  handler: BodyHandler<I, O, false>
): NextApiHandler<O> {
  return route(schema, false, ["POST"], handler as EitherHandler<I, O, false>);
}

export function postAuthed<I, O>(
  schema: JSONSchemaType<I>,
  handler: BodyHandler<I, O, true>
): NextApiHandler<O> {
  return route(schema, true, ["POST"], handler as EitherHandler<I, O, true>);
}

export function get<O>(handler: NoBodyHandler<O, false>): NextApiHandler<O> {
  return route(null, false, ["GET"], handler);
}

export function getAuthed<O>(
  handler: NoBodyHandler<O, true>
): NextApiHandler<O> {
  return route(null, true, ["GET"], handler);
}

export abstract class StatusException {
  abstract readonly status: number;
}

export class NotFoundException extends StatusException {
  readonly status = 404;
}

export class ForbiddenException extends StatusException {
  readonly status = 403;
}

export class BadRequestException extends StatusException {
  readonly status = 400;
}

export class ResourceLimitException extends StatusException {
  readonly status = 409;
}

type HandlerParams<E, A extends boolean> = E & {
  user: A extends true ? UserInfo : UserInfo | null;
  req: NextApiRequest;
  res: NextApiResponse;
};

type Handler<E, O, A extends boolean> = (
  params: HandlerParams<E, A>
) => O | Promise<O>;
type EitherHandler<I, O, A extends boolean> = Handler<{ data: I } | {}, O, A>;
type BodyHandler<I, O, A extends boolean> = Handler<{ data: I }, O, A>;
type NoBodyHandler<O, A extends boolean> = Handler<{}, O, A>;

function route<I, O, A extends boolean>(
  schema: JSONSchemaType<I> | null,
  requireAuth: A,
  methods: string[],
  handler: EitherHandler<I, O, A>
): NextApiHandler<O> {
  return async (req, res) => {
    if (!methods.includes(req.method as string)) {
      res.status(405).end();
      return;
    }

    const user = await getUserInfo(req, res);
    if (requireAuth && user === null) {
      res.status(401).end();
      return;
    }

    const rateLimited = await rateLimit(req, user);
    if (rateLimited) {
      res.status(429).end();
      return;
    }

    let params: Parameters<typeof handler>[0] = {
      user: user as A extends true ? UserInfo : UserInfo | null,
      req,
      res,
    };

    if (schema !== null) {
      const data = req.body;

      if (!validate(schema, data)) {
        res.status(400).end();
        return;
      }

      params = { ...params, data: data as I };
    }

    try {
      const result = await handler(params);
      res.json(result);
    } catch (error) {
      if (error instanceof StatusException) {
        res.status(error.status).end();
        return;
      } else {
        throw error;
      }
    }
  };
}
