import { useEffect, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { MdEdit, MdPerson } from "react-icons/md";
import { toast } from "react-toastify";
import styled from "styled-components";
import { NAME_PATTERN } from "../../lib/api-types";
import type {
  Participant as ParticipantData,
  Tourney as TourneyData,
} from "../../lib/api-types";
import {
  ApiUpdater,
  createParticipant,
  deleteParticipant,
  moveParticipant,
  updateParticipant,
} from "../../lib/client/api";
import { cleanedValue } from "../../lib/client/util";
import { ButtonError, ButtonSuccess } from "../button";
import Input from "../input";
import Card, { CardButton, CardContent } from "./card";

const ParticipantsList = ({
  tourney,
  tourneyUpdater,
}: {
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => (
  <>
    {tourneyUpdater === null ? null : (
      <AddControls tourney={tourney} tourneyUpdater={tourneyUpdater} />
    )}

    {tourney.participants.length === 0 ? (
      tourneyUpdater === null ? (
        <p>No participants have been added yet.</p>
      ) : null
    ) : (
      <Participants tourney={tourney} tourneyUpdater={tourneyUpdater} />
    )}
  </>
);

export default ParticipantsList;

const ParticipantsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Participants = ({
  tourney,
  tourneyUpdater,
}: {
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => {
  const [ssr, setSsr] = useState(true);
  useEffect(() => setSsr(false), []);

  if (ssr || tourneyUpdater === null) {
    return (
      <ParticipantsContainer>
        {tourney.participants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            tourney={tourney}
            tourneyUpdater={tourneyUpdater}
          />
        ))}
      </ParticipantsContainer>
    );
  } else {
    return (
      <DndParticipants tourney={tourney} tourneyUpdater={tourneyUpdater} />
    );
  }
};

const DndParticipants = ({
  tourney,
  tourneyUpdater,
}: {
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData>;
}) => {
  const [participants, setParticipants] = useState(tourney.participants);

  useEffect(() => {
    setParticipants(tourney.participants);
  }, [tourney.participants]);

  return (
    <DragDropContext
      onDragEnd={({ source, destination }) => {
        if (!destination || source.index === destination.index) {
          return;
        }

        const newParticipants = [...participants];
        const [participant] = newParticipants.splice(source.index, 1);
        newParticipants.splice(destination.index, 0, participant);

        setParticipants(newParticipants);

        const indexDelta = destination.index - source.index;
        moveParticipant(tourney.id, participant.id, { indexDelta }).then(
          (result) => {
            if (result.data === null) {
              console.error(result);
              toast.error("Could not move participant");
              tourneyUpdater.revalidate();
            } else {
              tourneyUpdater(result.data.tourney);
              setParticipants(result.data.tourney.participants);
            }
          }
        );
      }}
    >
      <Droppable droppableId="droppable">
        {(provided) => (
          <ParticipantsContainer
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {participants.map((participant, i) => (
              <Draggable
                key={participant.id}
                draggableId={participant.id}
                index={i}
              >
                {(provided) => (
                  <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                  >
                    <ParticipantCard
                      participant={participant}
                      tourney={tourney}
                      tourneyUpdater={tourneyUpdater}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ParticipantsContainer>
        )}
      </Droppable>
    </DragDropContext>
  );
};

const ParticipantCard = ({
  participant,
  tourney,
  tourneyUpdater,
}: {
  participant: ParticipantData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData> | null;
}) => {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      {editing ? (
        <EditingParticipant
          participant={participant}
          tourney={tourney}
          tourneyUpdater={tourneyUpdater!!}
          setEditing={setEditing}
        />
      ) : (
        <NonEditingParticipant
          participant={participant}
          editable={tourneyUpdater !== null}
          setEditing={setEditing}
        />
      )}
    </Card>
  );
};

const Name = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NonEditingParticipant = ({
  participant,
  editable,
  setEditing,
}: {
  participant: ParticipantData;
  editable: boolean;
  setEditing(value: boolean): void;
}) => (
  <>
    <CardContent>
      <MdPerson />
      <Name>{participant.name}</Name>
    </CardContent>

    {editable ? (
      <CardButton onClick={() => setEditing(true)}>
        <MdEdit />
      </CardButton>
    ) : null}
  </>
);

const EditingParticipantContainer = styled.form`
  flex-grow: 1;
`;

const EditingParticipantButtonsContainer = styled.div`
  display: flex;
  margin-top: 0.5rem;
  gap: 0.75rem;

  & > * {
    flex-grow: 1;
  }
`;

const EditingParticipant = ({
  participant,
  tourney,
  tourneyUpdater,
  setEditing,
}: {
  participant: ParticipantData;
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData>;
  setEditing(value: boolean): void;
}) => {
  const [processing, setProcessing] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  return (
    <EditingParticipantContainer
      onSubmit={async (e) => {
        e.preventDefault();

        if (processing) return;
        setProcessing(true);

        const name = cleanedValue(nameRef);

        const result = await updateParticipant(tourney.id, participant.id, {
          name,
        });

        if (result.data === null) {
          console.error(result);
          toast.error("Could not update participant");
        } else {
          tourneyUpdater(result.data.tourney);
          setEditing(false);
        }

        setProcessing(false);
      }}
    >
      <Input
        pattern={NAME_PATTERN}
        ref={nameRef}
        defaultValue={participant.name}
        placeholder="Participant name"
        autoFocus
      />

      <EditingParticipantButtonsContainer>
        <ButtonSuccess type="submit" disabled={processing}>
          Save
        </ButtonSuccess>
        <ButtonError
          disabled={processing}
          onClick={async (e) => {
            e.preventDefault();

            if (processing) return;
            setProcessing(true);

            const result = await deleteParticipant(tourney.id, participant.id);

            if (result.data === null) {
              console.error(result);
              toast.error("Could not delete participant");
              setProcessing(false);
            } else {
              tourneyUpdater(result.data.tourney);
            }
          }}
        >
          Delete
        </ButtonError>
      </EditingParticipantButtonsContainer>
    </EditingParticipantContainer>
  );
};

const AddControlsContainer = styled.form`
  display: flex;
  margin: 1rem 0;
  gap: 1.5rem;
`;

const AddControls = ({
  tourney,
  tourneyUpdater,
}: {
  tourney: TourneyData;
  tourneyUpdater: ApiUpdater<TourneyData>;
}) => {
  const [processing, setProcessing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <AddControlsContainer
      onSubmit={async (e) => {
        e.preventDefault();

        if (processing) return;

        setProcessing(true);

        const name = cleanedValue(inputRef);
        inputRef.current!!.value = "";

        const result = await createParticipant(tourney.id, { name });
        if (result.data === null) {
          toast.error("Could not add participant");
        } else {
          tourneyUpdater(result.data.tourney);
        }

        setProcessing(false);
      }}
    >
      <Input
        pattern={NAME_PATTERN}
        ref={inputRef}
        placeholder="Participant name"
        required
      />
      <ButtonSuccess type="submit" disabled={processing}>
        Add
      </ButtonSuccess>
    </AddControlsContainer>
  );
};
