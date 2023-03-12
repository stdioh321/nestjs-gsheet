export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  sheetName: process.env.SHEET_NAME || 'Sheet1',
  google: {
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
});
