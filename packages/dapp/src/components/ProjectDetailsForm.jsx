import { VStack, Wrap, WrapItem } from '@chakra-ui/react';
import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';
import { OrderedInput } from '../shared/OrderedInput';

const formatDate = date => {
  const d = new Date(date);

  let month = `${d.getMonth() + 1}`;
  if (month.length < 2) month = `0${month}`;

  let day = `${d.getDate()}`;
  if (day.length < 2) day = `0${day}`;

  const year = d.getFullYear();

  return [year, month, day].join('-');
};

export const ProjectDetailsForm = () => {
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

  return (
    <VStack w="100%" spacing="1rem">
      <OrderedInput
        label="Project Name or ID"
        value={projectName}
        setValue={setProjectName}
      />
      <OrderedInput
        label="Project Description"
        value={projectDescription}
        setValue={setProjectDescription}
        infoText="140 character limit • optional"
      />
      <OrderedInput
        label="Link to Project Agreement"
        value={projectAgreement}
        setValue={setProjectAgreement}
        tooltip="This agreement will be referenced in the case of a dispute"
      />
      <Wrap w="100%" spacing="1rem">
        <WrapItem>
          <OrderedInput
            label="Project Start Date"
            type="date"
            value={startDateString}
            setValue={v => setStartDate(Date.parse(v))}
            infoText="optional"
          />
        </WrapItem>
        <WrapItem>
          <OrderedInput
            label="Expected End Date"
            type="date"
            value={endDateString}
            setValue={v => setEndDate(Date.parse(v))}
            infoText="optional"
          />
        </WrapItem>
        <WrapItem>
          <OrderedInput
            label="Safety Valve Date"
            type="date"
            value={safetyValveDateString}
            setValue={v => setSafetyValveDate(Date.parse(v))}
            tooltip="The date at which funds cannot be moved"
          />
        </WrapItem>
      </Wrap>
    </VStack>
  );
};
