import React from "react";
import styled from "styled-components";
import { Tourney } from "../../lib/api-types";
import { ApiUpdater } from "../../lib/client/api";
import type { Bracket as BracketData } from "../../lib/client/bracket";
import { BACKGROUND_COLOR_DARK } from "../../lib/client/theme";
import CenterParagraph from "../center-paragraph";
import { CONTENT_SIZE } from "../content-sizer";
import BracketViewer from "./bracket-viewer";

const BracketSizerOuter = styled.div`
  margin: 0 5vw;
  display: flex;
  justify-content: center;
`;

const BracketSizerInner = styled.div`
  background-color: ${BACKGROUND_COLOR_DARK};
  min-width: ${CONTENT_SIZE};
  overflow-x: auto;
  border-radius: 0.25rem;
`;

const BracketContainer = styled.div`
  display: inline-flex;
  padding: 3rem 1rem;
  min-width: ${CONTENT_SIZE};
  justify-content: center;
`;

const BracketSection = ({
  bracket,
  tourney,
  tourneyUpdater,
}: {
  bracket: BracketData | null;
  tourney: Tourney;
  tourneyUpdater: ApiUpdater<Tourney> | null;
}) => (
  <BracketSizerOuter>
    <BracketSizerInner>
      <BracketContainer>
        <BracketContent
          bracket={bracket}
          tourney={tourney}
          tourneyUpdater={tourneyUpdater}
        />
      </BracketContainer>
    </BracketSizerInner>
  </BracketSizerOuter>
);

export default BracketSection;

const BracketContent = ({
  bracket,
  tourney,
  tourneyUpdater,
}: {
  bracket: BracketData | null;
  tourney: Tourney;
  tourneyUpdater: ApiUpdater<Tourney> | null;
}) => {
  if (bracket === null) {
    if (tourneyUpdater === null) {
      return (
        <CenterParagraph>
          A bracket will be generated when at least two participants have been
          added.
        </CenterParagraph>
      );
    } else {
      return (
        <CenterParagraph>
          Add at least two participants to generate a bracket.
        </CenterParagraph>
      );
    }
  }

  return (
    <BracketViewer
      bracket={bracket}
      tourney={tourney}
      tourneyUpdater={tourneyUpdater}
    />
  );
};
