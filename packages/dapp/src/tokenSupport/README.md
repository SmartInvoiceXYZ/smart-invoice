# To modify tokens:

1.  **Add/Remove Token Information to tokenSchema.json:**

            "{NEW CHAIN ID HERE}": [{
            "tokenContract": {CONTRACT OF TOKEN},
            "decimals": {# of DECIMALS USED BY TOKEN},
            "symbol": {TOKEN SYMBOL}
            } , {Another Token...} ],

2)  **Upload tokenSchema to IPFS (via CLI)** :
    - You can upload with any preferred method. To quickly upload with the IPFS CLI:
      - Install the IPFS CLI if needed [IPFS CLI Installation](https://docs.ipfs.io/install/command-line/#system-requirements)
      - Open a terminal and enter `ipfs daemon`
      - Enter the same directory as the updated tokenSchema and enter `ipfs add <filename`
      - Copy the CID that will appear on successful upload (ex. format: QmYFLxr9F3ykXNkxhwNffDdhEm1RWUf5WrxHdP8AUnS5B9)
3)  **Copy New CID into Firebase** :
    - You will need to be granted permission in order to login to Firebase and update token information.
      - Go to [Firebase Console](https://console.firebase.google.com/)
      - Login with the Google account that has been granted permission
      - Select smart-invoice from the project list
      - On the left hand side bar, select "Realtime Database".
      - Replace the old CID following `CID` with the new CID

The supported tokens will now be updated in the app..

Note: the firebase-CID-template.json file is included if at some point there are frequent token modifications and using the firebase CLI becomes the preferred method of updating.
