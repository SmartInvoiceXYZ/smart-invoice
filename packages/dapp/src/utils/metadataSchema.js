// This serves as the standardized schema that all smart invoice metadata must follow:

// MetadataSchema = {
//   projectName: 'Project Name',
//   projectDescription: 'Project Description',
//   projectAgreement: {
//     type: 'HTTP or IPFS or Arweave',
//     src: 'ipfs://<HASH> -or- https://<LINK>'
//   },
//   startDate: 'UNIX Timestamp',
//   endDate: 'UNIX Timestamp'
// }

export class MetadataSchema {
  constructor(
    projectName,
    projectDescription,
    projectAgreementLinkType,
    projectAgreementSrc,
    startDate,
    endDate,
  ) {
    this.projectName = projectName;
    this.projectDescription = projectDescription;
    this.projectAgreement = {
      type: projectAgreementLinkType,
      src: projectAgreementSrc,
    };
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
