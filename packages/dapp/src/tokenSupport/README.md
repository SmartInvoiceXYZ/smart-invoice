# To modify tokens:

1.  **Add/Remove Token Information to tokenSchema.json:**

            "{NEW CHAIN ID HERE}": [{
            "tokenContract": "CONTRACT OF TOKEN",
            "decimals": "# of DECIMALS USED BY TOKEN",
            "symbol": "TOKEN SYMBOL",
            "image": "link to hosted image"
            } , {Another Token...} ],

2)  **Upload tokenSchema to IPFS (via CLI)** :
    - Update tokenSchema.json with new token information according to schema above
    - cd into packages/dapp/src/tokenSupport
    - enter `node uploadTokenInfo.js' in the terminal
    - you will receive: `[ { hash: <CID HASH HERE> } ]`
3)  **Copy New CID into Firebase** :
    - You will need to be granted permission in order to login to Firebase and update token information.
      - Go to [Firebase Console](https://console.firebase.google.com/)
      - Login with the Google account that has been granted permission
      - Select smart-invoice from the project list
      - On the left hand side bar, select "Realtime Database".
      - Replace the old CID following `CID` with the new CID

The supported tokens will now be updated in the app.

Note: the firebase-CID-template.json file is included if at some point there are frequent token modifications and using the firebase CLI becomes the preferred method of updating.
