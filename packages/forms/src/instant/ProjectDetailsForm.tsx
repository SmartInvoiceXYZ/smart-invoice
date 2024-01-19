import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import {
  OrderedInput,
  // OrderedLinkInput,
  // OrderedTextarea,
  OrderedLinkInput,
  OrderedTextarea,
} from '@smart-invoice/ui';
import { formatDate } from '@smart-invoice/utils';
import React, { useContext, useState } from 'react';

type ProjectDetailsFormProps = {
  display?: boolean;
};

export function ProjectDetailsForm({ display }: ProjectDetailsFormProps) {
  // const startDateString = startDate ? formatDate(startDate) : '';
  // const endDateString = endDate ? formatDate(endDate) : '';
  // const [nameInvalid, setNameInvalid] = useState(false);
  // // eslint-disable-next-line no-unused-vars
  // const [dateInvalid, setDateInvalid] = useState(false);

  return (
    <VStack w="100%" spacing="1rem" display={display ? 'flex' : 'none'}>
      {/* <OrderedInput
        label="Project Name or ID"
        value={projectName}
        setValue={v => {
          setProjectName(v);
          setNameInvalid(v === '');
        }}
        isInvalid={nameInvalid}
        error={nameInvalid ? 'Cannot be empty' : ''}
        tooltip="Choose something easily identifiable by you & your client. This is how the invoice will appear on your sortable invoices list later."
        required="required"
      />

      <OrderedLinkInput
        label="Link to Project Agreement"
        value={projectAgreementSource}
        setValue={setProjectAgreementSource}
        linkType={projectAgreementLinkType}
        setLinkType={setProjectAgreementLinkType}
        tooltip="This agreement will be referenced if there is a payment dispute that goes to arbitration. Link a file that cannot be modified."
        required="required"
      />

      <OrderedTextarea
        label="Project Description"
        value={projectDescription}
        setValue={setProjectDescription}
        infoText="140 character limit"
        maxLength={140}
        required="optional"
        tooltip="This brief description will help you & your client remember key project details in the future."
      /> */}

      <SimpleGrid
        w="100%"
        spacing="1rem"
        columns={{ base: 1, sm: 2, md: 2 }}
        // mb={dateInvalid ? '-0.5rem' : ''}
      >
        {/* <OrderedInput
          label="Project Start Date"
          type="date"
          value={startDateString}
          setValue={v => setStartDate(Date.parse(v))}
          required="optional"
          tooltip="This is the date you expect to begin work on this project."
        />

        <OrderedInput
          label="Expected End Date"
          type="date"
          value={endDateString}
          setValue={v => setEndDate(Date.parse(v))}
          required="optional"
          tooltip="This is the date you expect to complete work on this project."
        /> */}
        {/* <OrderedInput
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
          tooltip="If you do not complete this project by this date, the client can withdraw deposited funds in escrow after 00:00:00 GMT on this date. (Add extra time after the expected end date, in case things take longer to complete)."
          isInvalid={dateInvalid}
          required="required"
        /> */}
      </SimpleGrid>
      {/* {dateInvalid && ( */}
      <Text
        w="100%"
        color="red"
        textAlign="right"
        fontSize="xs"
        fontWeight="700"
      >
        {/* {dateInvalid ? 'Invalid Safety Valve Date: Already Passed' : ''} */}{' '}
        Test
      </Text>
      {/* )} */}
    </VStack>
  );
}
