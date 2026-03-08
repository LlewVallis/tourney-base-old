import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useUser } from "../../../components/session-manager";
import TourneySection from "../../../components/tourney/tourney-section";
import type { Tourney } from "../../../lib/api-types";
import { useTourney } from "../../../lib/client/api";
import loadTourneyProps from "../../../lib/client/load-tourney-props";

export interface TourneyProps {
  tourney: Tourney;
}

const TourneyPage = ({ tourney }: TourneyProps) => (
  <main>
    <Content tourney={tourney} />
  </main>
);

export default TourneyPage;

const Content = ({ tourney: fallback }: TourneyProps) => {
  const [tourney, tourneyUpdater, apiResponse] = useTourney(fallback);

  const router = useRouter();
  if (apiResponse?.code === 404) {
    router.replace("/");
  }

  const user = useUser();
  const isOwner = user?.id === tourney.ownerId;

  return (
    <TourneySection
      tourney={tourney}
      tourneyUpdater={isOwner ? tourneyUpdater : null}
    />
  );
};

export const getServerSideProps: GetServerSideProps<TourneyProps> = (ctx) =>
  loadTourneyProps(false)(ctx);
