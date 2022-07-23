# smart-invoice mono repo

## Metadata Schema Standard

All metadata uploaded to IPFS and saved as details in a Smart Invoice contract must follow the standard schema below:

```js
{
  projectName: "Project Name",
  projectDescription: "description",
  projectAgreement: {
    type: "https", // or "ipfs"
    src: "https://urlToAgreement.com" // or "ipfs://<CID>"
  },
  startDate: UNIX_TIMESTAMP,
  endDate: UNIX_TIMESTAMP
}
```

Under `projectAgreement`, `type` and beginning of `src` MUST match exactly.
