import { GetServerSideProps } from "next";
import { Tourney } from "../api-types";
import { getUserInfo } from "../server/auth";
import { serializeTourney } from "../server/conversions";
import { fetchTourney, transaction } from "../server/db";
import { castString } from "../util";

export default function loadTourneyPros(
  mustOwn: boolean
): GetServerSideProps<{ tourney: Tourney }> {
  return async ({ query, req, res }) => {
    const id = castString(query.tourneyId);

    const dbTourney = await transaction((db) => fetchTourney(db, id));
    if (dbTourney === null) {
      return { notFound: true };
    }

    const tourney = serializeTourney(dbTourney);

    if (mustOwn) {
      const user = await getUserInfo(req, res);
      if (tourney.ownerId !== user?.id) {
        return {
          redirect: {
            permanent: false,
            destination: `/tourney/${encodeURIComponent(tourney.id)}`,
          },
        };
      }
    }

    return { props: { tourney } };
  };
}
