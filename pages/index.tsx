import { GetServerSideProps } from "next";
import TourneysSection from "../components/index/tourneys-section";
import WelcomeSection from "../components/index/welcome-section";
import SimpleLayout from "../components/simple-layout";
import { Tourney } from "../lib/api-types";
import { useMyTourneys } from "../lib/client/api";
import { getUserInfo } from "../lib/server/auth";
import { serializeTourney } from "../lib/server/conversions";
import { fetchUserTourneys, transaction } from "../lib/server/db";

interface IndexProps {
  tourneys: Tourney[] | null;
}

const Index = ({ tourneys }: IndexProps) => (
  <SimpleLayout>
    <Content tourneys={tourneys} />
  </SimpleLayout>
);

export default Index;

const Content = ({ tourneys: fallback }: IndexProps) => {
  const [{ tourneys }] = useMyTourneys({ tourneys: fallback });

  if (tourneys === null) {
    return <WelcomeSection />;
  } else {
    return <TourneysSection tourneys={tourneys} />;
  }
};

export const getServerSideProps: GetServerSideProps<IndexProps> = async ({
  req,
  res,
}) => {
  const user = await getUserInfo(req, res);

  if (user === null) {
    return { props: { tourneys: null } };
  } else {
    const dbTourneys = await transaction((db) =>
      fetchUserTourneys(db, user.id)
    );
    const tourneys = dbTourneys.map(serializeTourney);
    return { props: { tourneys } };
  }
};
