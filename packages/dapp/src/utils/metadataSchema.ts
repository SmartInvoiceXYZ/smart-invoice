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
  endDate: any;
  projectAgreement: any;
  projectDescription: any;
  projectName: any;
  startDate: any;
  constructor(
    projectName: any,
    projectDescription: any,
    projectAgreementLinkType: any,
    projectAgreementSrc: any,
    startDate: any,
    endDate: any,
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
