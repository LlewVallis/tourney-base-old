import html2canvas from "html2canvas";
import React, { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { IoMdTrophy } from "react-icons/io";
import { toast } from "react-toastify";
import styled from "styled-components";
import type {
  Participant as ParticipantData,
  Tourney as TourneyData,
} from "../../lib/api-types";
import {
  ApiUpdater,
  createMatchResult,
  deleteMatchResult,
  updateMatchResult,
} from "../../lib/client/api";
import type {
  Bracket as BracketData,
  Match as MatchData,
  Round as RoundData,
} from "../../lib/client/bracket";
import {
  BACKGROUND_COLOR_LIGHT,
  MIDTONE_COLOR,
  PRIMARY_COLOR,
  SUCCESS_COLOR,
} from "../../lib/client/theme";

const RoundsContainer = styled.div`
  display: inline-flex;
  text-align: left;
`;

const BracketViewer = ({
  bracket,
  tourney,
  tourneyUpdater,
}: {
  bracket: BracketData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <RoundsContainer ref={containerRef}>
      {bracket.rounds.map((round, i) => (
        <Round
          key={i}
          round={round}
          tourney={tourney}
          tourneyUpdater={tourneyUpdater}
        />
      ))}
    </RoundsContainer>
  );
};

export default BracketViewer;

export function createBracketImage(bracket: BracketData): Promise<string> {
  return new Promise((resolve) => {
    const outer = document.createElement("div");
    outer.style.position = "fixed";
    outer.style.opacity = "0";
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    inner.style.display = "inline-block";
    inner.style.fontSize = "30px";
    outer.appendChild(inner);

    const root = createRoot(inner);

    flushSync(() => {
      root.render(
        <BracketViewer
          bracket={bracket}
          tourney={bracket.tourney}
          tourneyUpdater={null}
        />
      );
    });

    html2canvas(inner, {
      backgroundColor: null,
    }).then((canvas) => {
      resolve(canvas.toDataURL());

      root.unmount();
      inner.remove();
      outer.remove();
    });
  });
}

const RoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const MATCH_HEIGHT = "3.5em";

const MatchSizer = styled.div`
  display: flex;
  flex-grow: 1;
  height: ${MATCH_HEIGHT};
  justify-content: right;
  align-items: center;
`;

const Round = ({
  round,
  tourney,
  tourneyUpdater,
}: {
  round: RoundData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => (
  <RoundContainer>
    {round.matches.map((match, i) => (
      <React.Fragment key={i}>
        {match === null ? (
          <MatchSizer />
        ) : (
          <Match
            match={match}
            tourney={tourney}
            tourneyUpdater={tourneyUpdater}
          />
        )}
      </React.Fragment>
    ))}
  </RoundContainer>
);

const MatchContainer = styled.div`
  width: 10em;
  height: 3em;
  margin: 0.5em 0;
  border-left: 0.25em solid ${PRIMARY_COLOR};
  border-radius: 0.25em;
  overflow: hidden;
`;

const Match = ({
  match,
  tourney,
  tourneyUpdater,
}: {
  match: MatchData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => {
  const [processing, setProcessing] = useState(false);

  const borderColor =
    match.result !== null
      ? PRIMARY_COLOR
      : match.firstParticipant !== null && match.secondParticipant !== null
      ? SUCCESS_COLOR
      : MIDTONE_COLOR;

  return (
    <MatchSizer>
      <MatchConnector match={match} />
      <MatchContainer
        style={{
          borderColor,
        }}
      >
        <Participant
          participant={match.firstParticipant}
          opponent={match.secondParticipant}
          processing={processing}
          setProcessing={setProcessing}
          match={match}
          tourney={tourney}
          tourneyUpdater={tourneyUpdater}
        />
        <Participant
          participant={match.secondParticipant}
          opponent={match.firstParticipant}
          processing={processing}
          setProcessing={setProcessing}
          match={match}
          tourney={tourney}
          tourneyUpdater={tourneyUpdater}
        />
      </MatchContainer>
    </MatchSizer>
  );
};

const ParticipantContainer = styled.div`
  display: flex;
  align-items: center;
  height: 50%;
  padding: 0 0.33em;
  background-color: ${BACKGROUND_COLOR_LIGHT};

  &:first-child {
    border-bottom: 1px dashed rgba(255, 255, 255, 0.25);
  }
`;

const ParticipantName = styled.div`
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const WINNER_COLOR = "#ddc32d";

const WinnerIndicatorContainer = styled.span`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 1em;
  color: ${WINNER_COLOR};
`;

const Participant = ({
  participant,
  opponent,
  processing,
  setProcessing,
  match,
  tourney,
  tourneyUpdater,
}: {
  participant: ParticipantData | null;
  opponent: ParticipantData | null;
  processing: boolean;
  setProcessing: (value: boolean) => void;
  match: MatchData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => {
  const allowReporting =
    tourneyUpdater !== null &&
    match.firstParticipant !== null &&
    match.secondParticipant !== null;

  const isWinner =
    participant !== null && match.result?.winner === participant.id;

  return (
    <ParticipantContainer>
      <ParticipantName>{participant?.name ?? <>&mdash;</>}</ParticipantName>

      {allowReporting ? (
        <ReportWinnerButton
          participant={participant!!}
          opponent={opponent!!}
          processing={processing}
          setProcessing={setProcessing}
          match={match}
          tourney={tourney}
          tourneyUpdater={tourneyUpdater}
        />
      ) : (
        <WinnerIndicatorContainer>
          {isWinner ? <IoMdTrophy /> : null}
        </WinnerIndicatorContainer>
      )}
    </ParticipantContainer>
  );
};

const ReportWinnerButtonContainer = styled.a`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 1em;

  color: ${MIDTONE_COLOR};

  &.set {
    color: ${WINNER_COLOR};
  }

  &:hover:not(.processing) {
    filter: brightness(85%);
  }
`;

const ReportWinnerButton = ({
  participant,
  opponent,
  processing,
  setProcessing,
  match,
  tourney,
  tourneyUpdater,
}: {
  participant: ParticipantData;
  opponent: ParticipantData;
  processing: boolean;
  setProcessing: (value: boolean) => void;
  match: MatchData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData>;
}) => {
  const isWinner = match.result?.winner === participant.id;
  const isLoser = match.result?.loser === participant.id;

  return (
    <ReportWinnerButtonContainer
      className={isWinner ? "set" : ""}
      onClick={async () => {
        if (processing) return;
        setProcessing(true);

        if (isWinner) {
          const result = await deleteMatchResult(tourney.id, match.result!!.id);

          if (result.data === null) {
            console.error(result);
            toast.error("Could not delete match");
            tourneyUpdater.revalidate();
          } else {
            tourneyUpdater(result.data.tourney);
          }
        } else if (isLoser) {
          const result = await updateMatchResult(
            tourney.id,
            match.result!!.id,
            {
              winner: participant.id,
              loser: opponent.id,
            }
          );

          if (result.data === null) {
            console.error(result);
            toast.error("Could not update match");
            tourneyUpdater.revalidate();
          } else {
            tourneyUpdater(result.data.tourney);
          }
        } else {
          const result = await createMatchResult(tourney.id, {
            winner: participant.id,
            loser: opponent.id,
          });

          if (result.data === null) {
            console.error(result);
            toast.error("Could not record match");
            tourneyUpdater.revalidate();
          } else {
            tourneyUpdater(result.data.tourney);
          }
        }

        setProcessing(false);
      }}
    >
      <IoMdTrophy />
    </ReportWinnerButtonContainer>
  );
};

const MatchConnector = ({ match }: { match: MatchData }) => {
  const { firstPredecessor: top, secondPredecessor: bottom } = match;

  if (top === null && bottom === null) {
    return null;
  }

  if (top !== null && bottom === null) {
    return <SingleConnectorSvg />;
  }

  if (top !== null && bottom !== null) {
    return <DoubleConnectorSvg />;
  }

  throw new Error("Illegal bracket layout");
};

const ConnectorSvg = styled.svg`
  shape-rendering: crispEdges;
  width: 2em;
  height: 100%;
  opacity: 0.66;
`;

const SingleConnectorSvg = () => (
  <ConnectorSvg
    stroke="white"
    strokeWidth="2px"
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line vectorEffect="non-scaling-stroke" x1="0" y1="25" x2="50" y2="25" />
    <line vectorEffect="non-scaling-stroke" x1="50" y1="25" x2="50" y2="50" />
    <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="100" y2="50" />
  </ConnectorSvg>
);

const DoubleConnectorSvg = () => (
  <ConnectorSvg
    stroke="white"
    strokeWidth="2px"
    preserveAspectRatio="none"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line vectorEffect="non-scaling-stroke" x1="0" y1="25" x2="50" y2="25" />
    <line vectorEffect="non-scaling-stroke" x1="50" y1="25" x2="50" y2="50" />
    <line vectorEffect="non-scaling-stroke" x1="0" y1="75" x2="50" y2="75" />
    <line vectorEffect="non-scaling-stroke" x1="50" y1="75" x2="50" y2="50" />
    <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="100" y2="50" />
  </ConnectorSvg>
);
