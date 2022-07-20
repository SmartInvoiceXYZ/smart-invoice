import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import React, { useContext, useState } from 'react';

import { CreateContext } from '../context/CreateContext';
import {
  OrderedInput,
  OrderedLinkInput,
  OrderedTextarea,
} from '../shared/OrderedInput';

const formatDate = date => {
  const d = new Date(date);

  let month = `${d.getUTCMonth() + 1}`;
  if (month.length < 2) month = `0${month}`;

  let day = `${d.getUTCDate()}`;
  if (day.length < 2) day = `0${day}`;

  const year = d.getUTCFullYear();

  return [year, month, day].join('-');
};

export const ProjectDetailsForm = ({ display }) => {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    safetyValveDate,
    setSafetyValveDate,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    projectAgreement,
    setProjectAgreement,
  } = useContext(CreateContext);

  const startDateString = startDate ? formatDate(startDate) : '';
  const endDateString = endDate ? formatDate(endDate) : '';
  const safetyValveDateString = safetyValveDate
    ? formatDate(safetyValveDate)
    : '';

  const [nameInvalid, setNameInvalid] = useState(false);
  const [dateInvalid, setDateInvalid] = useState(false);

  return (
    <VStack w="100%" spacing="1rem" display={display}>
      <OrderedInput
        label="Project Name or ID"
        value={projectName}
        setValue={v => {
          setProjectName(v);
          setNameInvalid(v === '');
        }}
        isInvalid={nameInvalid}
        error={nameInvalid ? 'Cannot be empty' : ''}
      />
      <OrderedLinkInput
        label="Link to Project Agreement"
        value={projectAgreement.src}
        setValue={setProjectAgreement}
        tooltip="This agreement will be referenced in the case of a dispute"
      />
      <OrderedTextarea
        label="Project Description"
        value={projectDescription}
        setValue={setProjectDescription}
        infoText="140 character limit • optional"
        maxLength="140"
      />
      <SimpleGrid
        w="100%"
        spacing="1rem"
        columns={{ base: 1, sm: 2, md: 3 }}
        mb={dateInvalid ? '-0.5rem' : ''}
      >
        <OrderedInput
          label="Project Start Date"
          type="date"
          value={startDateString}
          setValue={v => setStartDate(Date.parse(v))}
          infoText="optional"
        />
        <OrderedInput
          label="Expected End Date"
          type="date"
          value={endDateString}
          setValue={v => setEndDate(Date.parse(v))}
          infoText="optional"
        />
        <OrderedInput
          gridArea={{
            base: 'auto/auto/auto/auto',
            sm: '2/1/2/span 2',
            md: 'auto/auto/auto/auto',
          }}
          label="Safety Valve Date"
          type="date"
          value={safetyValveDateString}
          setValue={v => {
            const date = Date.parse(v);
            setSafetyValveDate(date);
            setDateInvalid(date < new Date().getTime());
          }}
          tooltip="The funds can be withdrawn by the client after 00:00:00 GMT on this date."
          isInvalid={dateInvalid}
        />
      </SimpleGrid>
      {dateInvalid && (
        <Text
          w="100%"
          color="purple"
          textAlign="right"
          fontSize="xs"
          fontWeight="700"
        >
          {dateInvalid ? 'Invalid Safety Valve Date: Already Passed' : ''}
        </Text>
      )}
    </VStack>
  );
};
