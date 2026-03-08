import { useMemo } from "react";
import { MdFullscreen, MdPrint, MdSettings } from "react-icons/md";
import styled from "styled-components";
import { Tourney } from "../../lib/api-types";
import { ApiUpdater } from "../../lib/client/api";
import { createBracket } from "../../lib/client/bracket";
import ContentSizer from "../content-sizer";
import { Heading, HeadingIcon, HeadingIconLink } from "../heading";
import BracketSection from "./bracket-section";
import { createBracketImage } from "./bracket-viewer";
import ParticipantAndMatchesSection from "./participants-and-matches-section";

const DetailsContainer = styled.div`
  margin-top: 4rem;
`;

const TourneySection = ({
  tourney,
  tourneyUpdater,
}: {
  tourney: Tourney;
  tourneyUpdater: ApiUpdater<Tourney> | null;
}) => {
  const bracket = useMemo(() => createBracket(tourney), [tourney]);

  return (
    <>
      <ContentSizer>
        <Heading content={tourney.name}>
          {bracket === null ? null : (
            <HeadingIconLink
              href={`/tourney/${encodeURIComponent(tourney.id)}/embed`}
            >
              <MdFullscreen />
            </HeadingIconLink>
          )}

          {bracket === null ? null : (
            <HeadingIcon
              onClick={async () => {
                const tab = window.open();

                if (tab !== null) {
                  const image = await createBracketImage(bracket);

                  try {
                    const blob = await (await fetch(image)).blob();
                    const blobUrl = URL.createObjectURL(blob);
                    tab.location.href = blobUrl;

                    // Give the new tab enough time to load before revoking.
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
                  } catch {
                    // Fallback for environments that fail blob conversion.
                    tab.document.open();
                    tab.document.write(
                      `<img src="${image}" style="max-width:100%;height:auto;" />`
                    );
                    tab.document.close();
                  }
                }
              }}
            >
              <MdPrint />
            </HeadingIcon>
          )}

          {tourneyUpdater === null ? null : (
            <HeadingIconLink
              href={`/tourney/${encodeURIComponent(tourney.id)}/settings`}
            >
              <MdSettings />
            </HeadingIconLink>
          )}
        </Heading>
      </ContentSizer>

      <BracketSection
        bracket={bracket}
        tourney={tourney}
        tourneyUpdater={tourneyUpdater}
      />

      <DetailsContainer>
        <ContentSizer>
          <ParticipantAndMatchesSection
            bracket={bracket}
            tourney={tourney}
            tourneyUpdater={tourneyUpdater}
          />
        </ContentSizer>
      </DetailsContainer>
    </>
  );
};

export default TourneySection;
