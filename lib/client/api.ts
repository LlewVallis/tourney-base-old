import { useRef } from "react";
import useSWR from "swr";
import {
  CreateMatchResultRequest,
  CreateMatchResultResponse,
  CreateParticipantRequest,
  CreateParticipantResponse,
  CreateTourneyRequest,
  CreateTourneyResponse,
  DeleteMatchResultResponse,
  DeleteParticipantResponse,
  DeleteTourneyResponse,
  GetTourneyResponse,
  MoveParticipantRequest,
  MoveParticipantResponse,
  MyTourneysResponse,
  UpdateMatchResultRequest,
  UpdateMatchResultResponse,
  UpdateParticipantRequest,
  UpdateParticipantResponse,
  UpdateTourneyRequest,
  UpdateTourneyResponse,
} from "../api-types";

const API_PREFIX = "/api/v1";

export type UseResult<T> = [T, ApiUpdater<T>, QueryResult<T> | null];

export interface ApiUpdater<T> {
  (value: T): void;
  revalidate(): Promise<void>;
}

export type QueryResult<T> =
  | { status: "success"; code: number; data: T; error: null }
  | { status: "error"; code: number | null; data: null; error: string };

export function useMyTourneys(
  fallback: MyTourneysResponse
): UseResult<MyTourneysResponse> {
  return useApi<MyTourneysResponse>("/tourney/mine", fallback);
}

export function useTourney(
  fallback: GetTourneyResponse
): UseResult<GetTourneyResponse> {
  return useApi<GetTourneyResponse>(
    `/tourney/${encodeURIComponent(fallback.id)}`,
    fallback
  );
}

export function createTourney(
  request: CreateTourneyRequest
): Promise<QueryResult<CreateTourneyResponse>> {
  return postApi("/tourney/create", request);
}

export function updateTourney(
  id: string,
  request: UpdateTourneyRequest
): Promise<QueryResult<UpdateTourneyResponse>> {
  return postApi(`/tourney/${encodeURIComponent(id)}/update`, request);
}

export function deleteTourney(
  id: string
): Promise<QueryResult<DeleteTourneyResponse>> {
  return postApi(`/tourney/${encodeURIComponent(id)}/delete`, {});
}

export function createParticipant(
  tourneyId: string,
  request: CreateParticipantRequest
): Promise<QueryResult<CreateParticipantResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(tourneyId)}/participant/create`,
    request
  );
}

export function updateParticipant(
  tourneyId: string,
  participantId: string,
  request: UpdateParticipantRequest
): Promise<QueryResult<UpdateParticipantResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(
      tourneyId
    )}/participant/${participantId}/update`,
    request
  );
}

export function moveParticipant(
  tourneyId: string,
  participantId: string,
  request: MoveParticipantRequest
): Promise<QueryResult<MoveParticipantResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(
      tourneyId
    )}/participant/${participantId}/move`,
    request
  );
}

export function deleteParticipant(
  tourneyId: string,
  participantId: string
): Promise<QueryResult<DeleteParticipantResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(tourneyId)}/participant/${encodeURIComponent(
      participantId
    )}/delete`,
    {}
  );
}

export function createMatchResult(
  tourneyId: string,
  request: CreateMatchResultRequest
): Promise<QueryResult<CreateMatchResultResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(tourneyId)}/match-result/create`,
    request
  );
}

export function updateMatchResult(
  tourneyId: string,
  matchResultId: string,
  request: UpdateMatchResultRequest
): Promise<QueryResult<UpdateMatchResultResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(
      tourneyId
    )}/match-result/${encodeURIComponent(matchResultId)}/update`,
    request
  );
}

export function deleteMatchResult(
  tourneyId: string,
  matchResultId: string
): Promise<QueryResult<DeleteMatchResultResponse>> {
  return postApi(
    `/tourney/${encodeURIComponent(
      tourneyId
    )}/match-result/${encodeURIComponent(matchResultId)}/delete`,
    {}
  );
}

function useApi<T>(endpoint: string, fallback: T): UseResult<T> {
  type State =
    | { type: "direct"; value: T }
    | { type: "query"; result: QueryResult<T> };

  async function fetcher<T>(...args: Parameters<typeof fetch>) {
    const result = await queryApi<T>(...args);
    return { type: "query", result } as const;
  }

  const { data: state, mutate } = useSWR<State, never>(
    API_PREFIX + endpoint,
    fetcher,
    { refreshInterval: 5000 }
  );

  const valueRef = useRef(fallback);
  const responseRef = useRef<QueryResult<T> | null>(null);

  if (state !== null && state !== undefined) {
    if (state.type === "direct") {
      valueRef.current = state.value;
    } else {
      responseRef.current = state.result;

      if (state.result.data !== null) {
        valueRef.current = state.result.data;
      }
    }
  }

  const updater: ApiUpdater<T> = Object.assign(
    (value: T) => {
      mutate({ type: "direct", value }, false);
    },
    {
      revalidate: async () => {
        await mutate();
      },
    }
  );

  return [valueRef.current, updater, responseRef.current];
}

function postApi<T>(endpoint: string, input: unknown): Promise<QueryResult<T>> {
  return queryApi(API_PREFIX + endpoint, {
    method: "POST",
    headers: [["Content-Type", "application/json"]],
    body: JSON.stringify(input),
  });
}

async function queryApi<T>(
  ...args: Parameters<typeof fetch>
): Promise<QueryResult<T>> {
  let res: Response | null = null;

  try {
    res = await fetch(...args);
    if (!res.ok) {
      throw res.statusText;
    }

    const data = await res.json();

    return { status: "success", code: res.status, data, error: null };
  } catch (error) {
    return {
      status: "error",
      code: res?.status ?? null,
      data: null,
      error: `${error}`,
    };
  }
}
