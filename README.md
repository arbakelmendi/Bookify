# Bookify – Lab Course 1 (2026)
Aplikacion web për librari personale (ngjashëm me Spotify/Prime Video), me:
- menaxhim librash
- friend requests
- dhurata
- ndjekje të leximit

Projekti realizohet si punë ekipore në kuadër të lëndës **Lab Course 1**.

---

## Teknologjitë e përdorura
- **Backend**: ASP.NET Core Web API (.NET 8)
- **Database**: Microsoft SQL Server (Docker Compose)
- **ORM**: Entity Framework Core
- **Autentifikimi**: JWT
- **Frontend**: React + Tailwind (template i gatshëm)
- **Menaxhim projekti**: Git & Trello

---

## 1) Parakushtet
Sigurohuni që i keni të instaluara:
- .NET SDK 8.x
- Docker Desktop
- Git

Opsionale (për me pa databazën):
- SQL Server Management Studio (SSMS)

Kontroll:
```bash
dotnet --version
docker --version
git --version



## 2) Struktura e projektit
    Bookify/
  docker/
    docker-compose.yml
    .env
  backend/
    PersonalLibrary.Api/
  frontend/


## 3) Ngritja e databazës (Docker Compose)
    Nga root i projektit:
        cd docker
        docker compose up -d
        docker ps
    Nëse shfaqet bookify-mssql si running, databaza është gati.

    Ndalja e databazës:
        docker compose down

    Reset i plotë i databazës (fshin të gjitha të dhënat):
        docker compose down -v


 ## 4) Konfigurimi i Backend-it (Connection String)

    Password-at NUK ruhen në Git.
    Krijoni file-in lokal:
    backend/PersonalLibrary.Api/appsettings.Development.json

Shembull:
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=BookifyDb;User Id=sa;Password=YourStrongPassword123!;TrustServerCertificate=True;"
  }
}
     Password-i duhet të përputhet me atë në docker/.env.
     Ky file është i injoruar nga Git (.gitignore).


## 5) Krijimi / përditësimi i databazës (EF Migrations)

     Nga root i projektit:
        cd backend/PersonalLibrary.Api
        dotnet ef database update
    Kjo komandë:
        krijon databazën BookifyDb automatikisht
        krijon ose përditëson tabelat sipas migrations

## 6) Nisja e Backend-it

        cd backend/PersonalLibrary.Api
        dotnet run
    Swagger (API dokumentacioni):
        http://localhost:5116/swagger
(Porti mund të ndryshojë sipas launchSettings)


## 7) Nisja e Frontend-it

    cd frontend
    npm install
    npm run dev
Frontend duhet të lidhet me backend-in në:
    http://localhost:5116


## 8) Workflow ekipor për databazën (Migrations)

    Kur një anëtar i ekipit shton tabela ose ndryshon modele:
    Ndryshon modelet / DbContext
    Krijon migration:
        cd backend/PersonalLibrary.Api
        dotnet ef migrations add EmriIMigrationit

    Commit & push:
        git add .
        git commit -m "feat: add <emri i funksionalitetit>"
        git push

    Anëtarët tjerë të ekipit:
        dotnet ef database update

    Databaza e tyre përditësohet automatikisht.


## 9) Probleme të zakonshme
    EF migrations dështojnë
        Sigurohuni që dotnet run është i ndalur (Ctrl + C).
    
    Backend nuk lidhet me DB
        Kontrolloni nëse DB është aktive:
            cd docker
            docker compose up -d
    
    Reset total
        cd docker
        docker compose down -v
        docker compose up -d
        cd ../backend/PersonalLibrary.Api
        dotnet ef database update


## 10) Shënime të rëndësishme

    Folderat bin/ dhe obj/ nuk duhen commit-uar
    appsettings.Development.json nuk duhet commit-uar
    Databaza krijohet gjithmonë përmes migrations, jo manualisht

