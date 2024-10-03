import { Box, Button, Grid, SimpleGrid, Stack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS, INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { ValueOf } from '@smartinvoicexyz/types';
import {
  DatePicker,
  Input,
  LinkInput,
  Textarea,
  useMediaStyles,
} from '@smartinvoicexyz/ui';
import {
  oneMonthFromNow,
  projectDetailsSchema,
  sevenDaysFromNow,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useForm, UseFormReturn } from 'react-hook-form';

type FormValues = {
  title: string | undefined;
  description: string | undefined;
  document: string | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
  safetyValveDate: Date | undefined;
  deadline: Date | undefined;
};

export function ProjectDetailsForm({
  invoiceForm,
  updateStep,
  type,
}: {
  invoiceForm: UseFormReturn;
  updateStep: () => void;
  type: ValueOf<typeof INVOICE_TYPES>;
}) {
  const { setValue, watch } = invoiceForm;

  const {
    title,
    description,
    document,
    startDate,
    endDate,
    safetyValveDate,
    deadline,
  } = watch();

  const localForm = useForm({
    resolver: yupResolver(projectDetailsSchema),
    defaultValues: {
      title,
      description,
      document: document || '',
      startDate: startDate || new Date(),
      endDate: endDate || sevenDaysFromNow(),
      safetyValveDate: safetyValveDate || oneMonthFromNow(),
      deadline: deadline || oneMonthFromNow(),
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = localForm;

  const { primaryButtonSize } = useMediaStyles();

  const onSubmit = async (values: Partial<FormValues>) => {
    setValue('title', values.title);
    setValue('description', values.description);
    setValue('document', values.document);
    setValue('startDate', values.startDate);
    setValue('endDate', values.endDate);
    setValue('safetyValveDate', values.safetyValveDate);
    setValue('deadline', values.deadline);

    // move form
    updateStep();
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={6} w="100%">
        <Input
          label="Title"
          name="title"
          tooltip="The name of the project"
          placeholder="An adventure slaying Moloch"
          registerOptions={{ required: true }}
          localForm={localForm}
        />
        <Textarea
          label="Description"
          name="description"
          tooltip="A detailed description of the project"
          placeholder="Describe the project in detail. What is the scope? What are the deliverables? What are the milestones? What are the expectations?"
          variant="outline"
          registerOptions={{ required: true }}
          localForm={localForm}
        />
        <LinkInput
          name="document"
          label="Project Proposal, Agreement or Specification"
          tooltip="A URL to a project proposal, agreement or specification. This could be a RIP or other proposal. This is optional."
          placeholder="github.com/AcmeAcademy/buidler"
          localForm={localForm}
        />

        <SimpleGrid columns={3}>
          <DatePicker
            label="Start Date"
            name="startDate"
            tooltip="The date the project is expected to start"
            localForm={localForm}
          />
          <DatePicker
            label="Estimated End Date"
            name="endDate"
            tooltip="The date the project is expected to end. This value is not formally used in the escrow."
            localForm={localForm}
          />
          {type === INVOICE_TYPES.Instant ? (
            <DatePicker
              name="deadline"
              label="Deadline"
              placeholder="Select a date"
              tooltip="A specific date when the total payment is due."
              localForm={localForm}
            />
          ) : (
            <DatePicker
              label="Safety Valve Date"
              name="safetyValveDate"
              tooltip="The date the client can withdraw funds. Should be well in the future generally!"
              localForm={localForm}
            />
          )}
        </SimpleGrid>

        <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
          <Button
            type="submit"
            isDisabled={!isValid}
            textTransform="uppercase"
            size={primaryButtonSize}
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
