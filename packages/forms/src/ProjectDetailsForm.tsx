import {
  Box,
  Button,
  // DatePicker,
  Grid,
  HStack,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS } from '@smart-invoice/constants';
import { Input, Textarea } from '@smart-invoice/ui';
import _ from 'lodash';
import { useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import * as Yup from 'yup';

// import { sevenDaysFromNow } from './EscrowDetailsForm';

const validationSchema = Yup.object().shape({
  projectName: Yup.string().required('Project Name is required'),
  projectDescription: Yup.string().required('Project Description is required'),
  projectAgreement: Yup.string().url('Agreement must be a valid URL'),
  // startDate: Yup.date().required('Start Date is required'),
  // endDate: Yup.date().required('End Date is required'),
  // safetyValveDate: Yup.date()
  //   .required('Safety valve date is required')
  //   .min(
  //     sevenDaysFromNow(),
  //     'Safety valve date must be at least a week in the future',
  //   ),
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
  const {
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
  } = watch();
  const localForm = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      projectName,
      projectDescription,
      projectAgreement: _.get(_.first(projectAgreement), 'src', ''),
    },
  });
  const {
    handleSubmit,
    setValue: localSetValue,
    watch: localWatch,
    formState: { isValid, errors },
  } = localForm;
  console.log(errors);

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const onSubmit = async (values: any) => {
    const localProjectAgreement = [];
    if (values.projectAgreement) {
      // TODO handle ipfs agreement link
      localProjectAgreement.push({
        type: 'https',
        src: values.projectAgreement,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    setValue('projectName', values.projectName);
    setValue('projectDescription', values.projectDescription);
    setValue('projectAgreement', localProjectAgreement);
    setValue('startDate', values.startDate);
    setValue('endDate', values.endDate);

    // move form
    updateStep();
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={6} w="100%">
        <Input
          label="Project Name"
          name="projectName"
          tooltip="The name of the project"
          placeholder="An adventure slaying Moloch"
          localForm={localForm}
        />
        <Textarea
          label="Description"
          name="projectDescription"
          tooltip="A detailed description of the project"
          placeholder="Describe the project in detail. What is the scope? What are the deliverables? What are the milestones? What are the expectations?"
          variant="outline"
          localForm={localForm}
        />
        <Input
          label="Project Proposal, Agreement or Specification"
          name="projectAgreement"
          tooltip="A URL to a project proposal, agreement or specification. This could be a RIP or other proposal. This is optional."
          placeholder="https://github.com/AcmeAcademy/buidler"
          localForm={localForm}
        />
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

        <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
          <Button
            type="submit"
            isDisabled={!isValid}
            textTransform="uppercase"
            size={buttonSize}
            fontFamily="mono"
            fontWeight="bold"
          >
            Next: {ESCROW_STEPS[1].next}
          </Button>
        </Grid>
      </Stack>
    </Box>
  );
}
