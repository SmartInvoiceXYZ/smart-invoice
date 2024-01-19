import {
  Box,
  Button,
  Card,
  // DatePicker,
  Flex,
  HStack,
  Input,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
// import { ProjectDetails } from '@smart-invoice/types';
import { useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as Yup from 'yup';

import { sevenDaysFromNow } from './EscrowDetailsForm';

const validationSchema = Yup.object().shape({
  projectName: Yup.string().required('Project Name is required'),
  projectDescription: Yup.string().required('Project Description is required'),
  agreement: Yup.string().url('Agreement must be a valid URL'),
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date().required('End Date is required'),
});

// interface ProjectDetailsForm extends ProjectDetails {
//   agreement?: string;
// }

export function ProjectDetailsForm({
  escrowForm,
  updateStep,
}: {
  escrowForm: UseFormReturn;
  updateStep: () => void;
}) {
  const { setValue, watch } = escrowForm;
  const { projectName, projectDescription, startDate, endDate } = watch();
  const localForm = useForm({
    resolver: yupResolver(validationSchema),
  });
  const {
    handleSubmit,
    setValue: localSetValue,
    watch: localWatch,
  } = localForm;
  const { startDate: localStartDate, endDate: localEndDate } = localWatch();

  const onSubmit = async (values: any) => {
    const projectAgreement = [];
    if (values.agreement) {
      // TODO handle ipfs agreement link
      projectAgreement.push({
        type: 'https',
        src: values.agreement,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    setValue('projectName', values.projectName);
    setValue('projectDescription', values.projectDescription);
    setValue('projectAgreement', projectAgreement);
    setValue('startDate', values.startDate);
    setValue('endDate', values.endDate);

    // move form
    updateStep();
  };

  useEffect(() => {
    localSetValue('projectName', projectName || '');
    localSetValue('projectDescription', projectDescription || '');
    localSetValue('startDate', startDate || new Date());
    localSetValue('endDate', endDate || sevenDaysFromNow());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card as="form" variant="filled" onSubmit={handleSubmit(onSubmit)} p={6}>
      <Stack spacing={6} w="100%">
        {/* <Input
          label='Project Name'
          name='projectName'
          tooltip='The name of the project'
          placeholder='An adventure slaying Moloch'
          localForm={localForm}
        />
        <Textarea
          label='Description'
          name='projectDescription'
          tooltip='A detailed description of the project'
          placeholder='Describe the project in detail. What is the scope? What are the deliverables? What are the milestones? What are the expectations?'
          variant='outline'
          localForm={localForm}
        />
        <Input
          label='Project Proposal, Agreement or Specification'
          name='agreement'
          tooltip='A URL to a project proposal, agreement or specification. This could be a RIP or other proposal. This is optional.'
          placeholder='https://github.com/AcmeAcademy/buidler'
          localForm={localForm}
        /> */}
        <HStack>
          <Box w="45%">
            {/* <DatePicker
              label='Start Date'
              name='startDate'
              tooltip='The date the project is expected to start'
              localForm={localForm}
              selected={localStartDate}
            /> */}
          </Box>
          <Box w="50%">
            {/* <DatePicker
              label='Estimated End Date'
              name='endDate'
              tooltip='The date the project is expected to end. This value is not formally used in the escrow.'
              localForm={localForm}
              selected={localEndDate}
            /> */}
          </Box>
        </HStack>

        <Flex justify="center">
          <Button type="submit">Next: Escrow Details</Button>
        </Flex>
      </Stack>
    </Card>
  );
}
