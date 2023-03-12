# NESTJS-GSHEET
NestJS application that creates a CRUD for the Google Sheets API

# Requirements
1. [Node 16](https://nodejs.org/en/download/)
2. [Postman](https://www.postman.com/downloads/)


# Setup
1. [Create a Google Cloud account](https://console.cloud.google.com)
2. Enable Google Sheets API
3. Get the necessary credentials from your google account: **private_key**, **client_email** and **client_id**
   1. Create an .env file
      ```sh
      cp .env.example .env
      ```
   2. Replace the three variables with the values collected above: **GOOGLE_PRIVATE_KEY**, **GOOGLE_CLIENT_EMAIL** and **GOOGLE_CLIENT_ID**
      ![.env](./docs/screenshots/01.png)
4. Get project dependencies:
   1. ```sh
        npm install -f
      ```
5. Download and import the postman file (path: ): [docs/postman/nestjs-gsheet.postman_collection.json](https://raw.githubusercontent.com/stdioh321/nestjs-gsheet/main/docs/postman/nestjs-gsheet.postman_collection.json)

# RUN
```sh
npm run start:dev
```
> Open your browser at: http://localhost:3000/healthcheck
> 
> Should receive the following result
> ![healthcheck](./docs/screenshots/02.png)


# References
* [Google Cloud account](https://console.cloud.google.com)