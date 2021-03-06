import React, { useState } from "react";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/react-hooks";
import PetsList from "../components/PetsList";
import NewPetModal from "../components/NewPetModal";
import Loader from "../components/Loader";

const PET_FRAGMENT = gql`
  fragment PetFields on Pet {
    id
    name
    type
    img
    vaccinated @client
  }
`;

const ALL_PETS = gql`
  query AllPets {
    pets {
      ...PetFields
    }
  }
  ${PET_FRAGMENT}
`;

const CREATE_PET = gql`
  mutation NewPet($newPet: NewPetInput!) {
    addPet(input: $newPet) {
      ...PetFields
    }
  }
  ${PET_FRAGMENT}
`;

export default function Pets() {
  const [modal, setModal] = useState(false);
  const { data, loading, error } = useQuery(ALL_PETS);
  const [createPet, newPet] = useMutation(CREATE_PET, {
    update(cache, { data: { addPet } }) {
      const { pets } = cache.readQuery({ query: ALL_PETS });
      cache.writeQuery({
        query: ALL_PETS,
        data: { pets: [addPet, ...pets] }
      });
    }
  });

  const onSubmit = input => {
    setModal(false);
    createPet({
      variables: {
        newPet: input
      },
      optimisticResponse: {
        __typename: "Mutation",
        addPet: {
          ...input,
          id: `${Date.now()}`,
          img: "",
          __typename: "Pet",
          vaccinated: true
        }
      }
    });
  };

  if (loading) return <Loader />;

  if (error || newPet.error) {
    const message = error.message || newPet.error.message;
    return <p>{message}</p>;
  }

  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />;
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>
          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets} />
      </section>
    </div>
  );
}
