# Exposition Management Toolbox

Software that enables curators to easily set up supported devices with the interactive content they need.

It consists of two parts:
  - Frontend UI written in TypeScript using the Angular framework
  - Backend API server written in C# using ASP.NET Core

As a part of device set up, the software is able to push content packages to connected clients.
These packages should be created using [cmtoolbox](https://www.github.com/iimcz/cmtoolbox).

## Dependencies

|Part|Software|Version|
|-|-|-|
|Backend|Node.js|14|
|Frontend|.NET Core|3.1|

## Setup

First, libraries used by the software have to be downloaded using the corresponding package manager.
The following commands should be run from the directory specified in the prompt (either `frontend` or `backend`).

For the frontend, run
```
.../emtoolbox/frontend $ npm ci
```

For the backend, run
```
.../emtoolbox/backend $ dotnet restore
```

Alternatively, from the repository root, copy and run the following:
```
cd frontend
npm ci
cd ../backend
dotnet restore
```

### Local Storage

The API server currently only supports a local directory where it looks for packages to push/list.
Its location can be set in two ways, in order of preference:
  - appsettings.json (or appsettings.Development.json): `EMToolbox:LocalPackageStoratePath`
  - Environment variable: `EMTOOLBOX_STORAGE`

The server will then look for files with the `.zip` extension in this directory.

## Running

To start the frontend (in development mode), run
```
.../emtoolbox/frontend $ npm start
```

To start the backend (in development mode), run
```
.../emtoolbox/backend $ dotnet run
```