# Анализ безопасности Docker контейнеров
## Задание
Необходимо развернуть окружение с веб-сайтом с использованием базы данных, настроить постоянное хранение и создать сетевое окружение. Проверить получившийся контейнер и образ на безопасность. В отчете привести скриншоты и описать последовательность действий. Разобрать вывод сканеров безопасности и предложить меры по их исправлению
## Описание системы
В рамках данной работы разработано веб-приложение отслеживания посещенных мест. Пользователь может просматривать, добавлять, изменять и удалять заметки о посещенном им месте. 
## Реализация
Приложение разработано с использованием микросервисной архитектуры на следующем стеке технологий
- Elastic Search
- ASP.NET Core
- React JS

---
Elastic Search используется для хранения записей о посещенных местах. Для этого был создан индекс places для хранения документов с полями title, description, visit_date. Все поля хранят информацию текстового типа для каждого документа.

Создать индекс возможно с помощью HTTP запроса или используя сторонний графический клиент, например, расширение для браузера Elasticvue.

```bash
curl -XPUT 'http://localhost:9200/places' -H 'Content-Type: application/json' -d '{"settings": {"number_of_shards": 1, "number_of_replicas": 0}, "mappings": {"properties": {"title": {"type": "text"}, "description": {"type": "text"}, "visit_date": {"type": "text"}}}}'
```

---
Микросервис, разработанный на ASP.NET Core, представляет собой REST API, выступает в качестве дополнительной абстракции и инкапсулирует в себе логику доступа к данным, хранящимся в Elastic Search. Разработан на языке программирования C# с архитектурным паттерном MVC. 

Для доступа к Elastic Search используется библиотека NEST и паттерн репозиторий.


**Реализация доступа к данным**
```csharp
using API.Models;
using Nest;

namespace Infrastructure.Repositories 
{
    public class PlacesRepository
    {
        private ElasticClient _client;

        public PlacesRepository(Uri connectionUri)
        {
            var node = connectionUri;
            var settings = new ConnectionSettings(node).DefaultIndex("places");
            _client = new ElasticClient(settings); 
        }

        public List<Place> GetAll() 
        {
            var response = _client.Search<Place>(s => s.Query(q => q.MatchAll()));
            
            var result = new List<Place>();

            for(int i = 0; i < response.Documents.Count; i++) 
            {
                var place = response.Documents.ElementAt(i);
                result.Add(new Place(id: response.Hits.ElementAt(i).Id, title: place.Title, 
                    description: place.Description, visitDate: place.VisitDate)
                );
            }
            
            return result;
        }

        public string GetId(string title)
        {
            var response = _client.Search<Place>(s => s
                .Query(q => q
                    .Match(m => m
                        .Field(f => f.Title)
                        .Query(title)
                    )
                )
            );
            
            return response.Hits.FirstOrDefault()?.Id ?? "";
        }

        public Place GetById(string id)
        {
            var response = _client.Get<Place>(id);
            return new Place(id, response.Source.Title, 
                response.Source.Description, response.Source.VisitDate
            );
        }

        public string Create(Place place)
        { 
            var result = _client.IndexDocument(new {
                title = place.Title,
                description = place.Description,
                visit_date = place.VisitDate
            });

            return result.Id;
        }

        public void Update(Place place)
        {
            _client.UpdateByQuery<Place>(u => u
            .Query(q => q
                .Term(f => f.Id, place.Id)
            )
            .Script(s => s
                .Source("ctx._source.title = params.title; ctx._source.description = params.description; ctx._source.visit_date = params.visitDate")
                .Params(p => p
                    .Add("title", place.Title)
                    .Add("description", place.Description)
                    .Add("visitDate", place.VisitDate)
                    )
                )
            );
        }

        public void Delete(string id) => _client.Delete<Place>(id);
    } 
}
```
**Модель данных**

```csharp
using System.ComponentModel.DataAnnotations;
using Nest;

namespace API.Models
{
    public class Place 
    {
        [PropertyName("_id")]
        public string Id { get; set; }
        [PropertyName("title")]
        public string Title { get; set; }
        [PropertyName("description")]
        public string Description { get; set; }
        [PropertyName("visit_date")]
        public string VisitDate { get; set; }

        public Place(string id, string title, string description, string visitDate)
        {
            Id = id;
            Title = title;
            Description = description;
            VisitDate = visitDate;
        }

        public Place(string title, string description, string visitDate)
        {
            Title = title;
            Description = description;
            VisitDate = visitDate;
        }

        public Place() { }
        
    }
}
```
**Контроллер**
```csharp
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using API.Models;
using System.Diagnostics;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlacesController : ControllerBase
    {
        private readonly PlacesRepository _placesRepository;

        public PlacesController()
        {
            _placesRepository = new PlacesRepository(new Uri(Environment.GetEnvironmentVariable("elastic-uri")));
        }

        [HttpGet]
        public ActionResult Get()
        {
            try
            {
                return Ok(JsonConvert.SerializeObject(_placesRepository.GetAll()));
            } 
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpGet("{id}")]
        public ActionResult Get(string id)
        {
            try
            {
                return Ok(JsonConvert.SerializeObject(_placesRepository.GetById(id)));
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpGet("find/id/{title}")]
        public ActionResult GetId(string title)
        {
            try
            {
               return Ok(JsonConvert.SerializeObject(_placesRepository.GetId(title)));
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpPost]
        public ActionResult Post(string title, string description, string visitDate) 
        {
            try
            {
                return Ok(_placesRepository.Create(new Place(title, description, visitDate)));
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpPut("{id}")]
        public ActionResult Put(string id, string title, string description, string visitDate)
        {
            try
            {
                _placesRepository.Update(new Place(id, title, description, visitDate));
                return Ok();
            }
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(string id) 
        {
            try
            {
                _placesRepository.Delete(id);
                return Ok();
            }
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }
    }
}
```
**Dockerfile контейнера**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["API.csproj", "./"]
RUN dotnet restore "API.csproj"
COPY . .
WORKDIR "/src/"
RUN dotnet build "API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "API.dll"]
```
***
Микросервис с клиентским приложением реализован на языке программирования JavaScript и библиотекой React.

В рамках данного приложения разработаны следующие React компоненты
- PlacesList - список всех заметок о посещенных местах
- PlaceItem - элемент списка с конкретным местом
- ChangeButton - кнопка изменения описания места
- DeleteButton - кнопка удаления места
- AddItemForm - форма добавления нового места в список


Данный контейнер содержит сервер nginx, на котором запущено React приложение

**Dockerfile микросервиса**

```dockerfile
FROM node:20.11.1 as builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine3.18
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

***
**Для развертывания данной системы написан файл docker compose**
```yml
version: "3"
services:
  api:
    container_name: places-api
    image: places-api:1.0.0
    environment:
      - elastic-uri=http://esearch:9200
    depends_on:
      - esearch
    ports:
      - "6692:80"

  places-presentation:
    container_name: places-presentation
    image: places-presentation:1.0.0
    ports:
      - "3100:80"
    depends_on:
      - api
      - esearch
    volumes:
      - places-presentation:/etc/nginx/

  esearch:
    container_name: esearch
    image: elasticsearch:7.6.2
    environment:
      - discovery.type=single-node
    volumes:
      - elastic-s:/usr/share/elasticsearch/data

volumes:
  elastic-s:
    external: true
    name: elastic-s
  places-presentation:
    external: true
    name: places-presentation
```
## Анализ безопасности контейнеров docker
Анализ проведен с помощью инструмента docker bench security


**Результаты сканирования**
```bash
sudo sh docker-bench-security.sh
# --------------------------------------------------------------------------------------------
# Docker Bench for Security v1.6.0
#
# Docker, Inc. (c) 2015-2024
#
# Checks for dozens of common best-practices around deploying Docker containers in production.
# Based on the CIS Docker Benchmark 1.6.0.
# --------------------------------------------------------------------------------------------

Initializing 2024-03-05T13:23:45+03:00


Section A - Check results

[INFO] 1 - Host Configuration
[INFO] 1.1 - Linux Hosts Specific Configuration
WARNING: No blkio throttle.read_bps_device support
WARNING: No blkio throttle.write_bps_device support
WARNING: No blkio throttle.read_iops_device support
WARNING: No blkio throttle.write_iops_device support
WARNING: daemon is not using the default seccomp profile
[WARN] 1.1.1 - Ensure a separate partition for containers has been created (Automated)
[INFO] 1.1.2 - Ensure only trusted users are allowed to control Docker daemon (Automated)
[INFO]       * Users: fokypoky
[WARN] 1.1.3 - Ensure auditing is configured for the Docker daemon (Automated)
[WARN] 1.1.4 - Ensure auditing is configured for Docker files and directories -/run/containerd (Automated)
[INFO] 1.1.5 - Ensure auditing is configured for Docker files and directories - /var/lib/docker (Automated)
[INFO]        * Directory not found
[INFO] 1.1.6 - Ensure auditing is configured for Docker files and directories - /etc/docker (Automated)
[INFO]        * Directory not found
[INFO] 1.1.7 - Ensure auditing is configured for Docker files and directories - docker.service (Automated)
[INFO]        * File not found
[INFO] 1.1.8 - Ensure auditing is configured for Docker files and directories - containerd.sock (Automated)
[INFO]        * File not found
[INFO] 1.1.9 - Ensure auditing is configured for Docker files and directories - docker.socket (Automated)
[INFO]        * File not found
[INFO] 1.1.10 - Ensure auditing is configured for Docker files and directories - /etc/default/docker (Automated)
[INFO]        * File not found
[INFO] 1.1.11 - Ensure auditing is configured for Dockerfiles and directories - /etc/docker/daemon.json (Automated)
[INFO]        * File not found
[INFO] 1.1.12 - 1.1.12 Ensure auditing is configured for Dockerfiles and directories - /etc/containerd/config.toml (Automated)
[INFO]        * File not found
[INFO] 1.1.13 - Ensure auditing is configured for Docker files and directories - /etc/sysconfig/docker (Automated)
[INFO]        * File not found
[INFO] 1.1.14 - Ensure auditing is configured for Docker files and directories - /usr/bin/containerd (Automated)
[INFO]         * File not found
[INFO] 1.1.15 - Ensure auditing is configured for Docker files and directories - /usr/bin/containerd-shim (Automated)
[INFO]         * File not found
[INFO] 1.1.16 - Ensure auditing is configured for Docker files and directories - /usr/bin/containerd-shim-runc-v1 (Automated)
[INFO]         * File not found
[INFO] 1.1.17 - Ensure auditing is configured for Docker files and directories - /usr/bin/containerd-shim-runc-v2 (Automated)
[INFO]         * File not found
[INFO] 1.1.18 - Ensure auditing is configured for Docker files and directories - /usr/bin/runc (Automated)
[INFO]         * File not found
[INFO] 1.2 - General Configuration
[NOTE] 1.2.1 - Ensure the container host has been Hardened (Manual)
[PASS] 1.2.2 - Ensure that the version of Docker is up to date (Manual)
[INFO]        * Using 25.0.3 which is current
[INFO]        * Check with your operating system vendor for support and security maintenance for Docker
W
[INFO] 2 - Docker daemon configuration
[NOTE] 2.1 - Run the Docker daemon as a non-root user, if possible (Manual)
docker-bench-security.sh: 37: [[: not found
[WARN] 2.2 - Ensure network traffic is restricted between containers on the default bridge (Scored)
[PASS] 2.3 - Ensure the logging level is set to 'info' (Scored)
docker-bench-security.sh: 96: [[: not found
[PASS] 2.4 - Ensure Docker is allowed to make changes to iptables (Scored)
docker-bench-security.sh: 118: [[: not found
[PASS] 2.5 - Ensure insecure registries are not used (Scored)
[PASS] 2.6 - Ensure aufs storage driver is not used (Scored)
[INFO] 2.7 - Ensure TLS authentication for Docker daemon is configured (Scored)
[INFO]      * Docker daemon not listening on TCP
docker-bench-security.sh: 185: [[: not found
[INFO] 2.8 - Ensure the default ulimit is configured appropriately (Manual)
[INFO]      * Default ulimit doesn't appear to be set
docker-bench-security.sh: 208: [[: not found
[WARN] 2.9 - Enable user namespace support (Scored)
[PASS] 2.10 - Ensure the default cgroup usage has been confirmed (Scored)
[PASS] 2.11 - Ensure base device size is not changed until needed (Scored)
docker-bench-security.sh: 276: [[: not found
[WARN] 2.12 - Ensure that authorization for Docker client commands is enabled (Scored)
[WARN] 2.13 - Ensure centralized and remote logging is configured (Scored)
[WARN] 2.14 - Ensure containers are restricted from acquiring new privileges (Scored)
[WARN] 2.15 - Ensure live restore is enabled (Scored)
[WARN] 2.16 - Ensure Userland Proxy is Disabled (Scored)
[INFO] 2.17 - Ensure that a daemon-wide custom seccomp profile is applied if appropriate (Manual)
[INFO] Ensure that experimental features are not implemented in production (Scored) (Deprecated)

[INFO] 3 - Docker daemon configuration files
[INFO] 3.1 - Ensure that the docker.service file ownership is set to root:root (Automated)
[INFO]      * File not found
[INFO] 3.2 - Ensure that docker.service file permissions are appropriately set (Automated)
[INFO]      * File not found
[INFO] 3.3 - Ensure that docker.socket file ownership is set to root:root (Automated)
[INFO]      * File not found
[INFO] 3.4 - Ensure that docker.socket file permissions are set to 644 or more restrictive (Automated)
[INFO]      * File not found
[INFO] 3.5 - Ensure that the /etc/docker directory ownership is set to root:root (Automated)
[INFO]      * Directory not found
[INFO] 3.6 - Ensure that /etc/docker directory permissions are set to 755 or more restrictively (Automated)
[INFO]      * Directory not found
[INFO] 3.7 - Ensure that registry certificate file ownership is set to root:root (Automated)
[INFO]      * Directory not found
[INFO] 3.8 - Ensure that registry certificate file permissions are set to 444 or more restrictively (Automated)
[INFO]      * Directory not found
[INFO] 3.9 - Ensure that TLS CA certificate file ownership is set to root:root (Automated)
[INFO]      * No TLS CA certificate found
[INFO] 3.10 - Ensure that TLS CA certificate file permissions are set to 444 or more restrictively (Automated)
[INFO]       * No TLS CA certificate found
[INFO] 3.11 - Ensure that Docker server certificate file ownership is set to root:root (Automated)
[INFO]       * No TLS Server certificate found
[INFO] 3.12 - Ensure that the Docker server certificate file permissions are set to 444 or more restrictively (Automated)
[INFO]       * No TLS Server certificate found
[INFO] 3.13 - Ensure that the Docker server certificate key file ownership is set to root:root (Automated)
[INFO]       * No TLS Key found
[INFO] 3.14 - Ensure that the Docker server certificate key file permissions are set to 400 (Automated)
[INFO]       * No TLS Key found
[PASS] 3.15 - Ensure that the Docker socket file ownership is set to root:docker (Automated)
[PASS] 3.16 - Ensure that the Docker socket file permissions are set to 660 or more restrictively (Automated)
[INFO] 3.17 - Ensure that the daemon.json file ownership is set to root:root (Automated)
[INFO]       * File not found
[INFO] 3.18 - Ensure that daemon.json file permissions are set to 644 or more restrictive (Automated)
[INFO]       * File not found
[INFO] 3.19 - Ensure that the /etc/default/docker file ownership is set to root:root (Automated)
[INFO]       * File not found
[INFO] 3.20 - Ensure that the /etc/default/docker file permissions are set to 644 or more restrictively (Automated)
[INFO]       * File not found
[INFO] 3.21 - Ensure that the /etc/sysconfig/docker file permissions are set to 644 or more restrictively (Automated)
[INFO]       * File not found
[INFO] 3.22 - Ensure that the /etc/sysconfig/docker file ownership is set to root:root (Automated)
[INFO]       * File not found
[INFO] 3.23 - Ensure that the Containerd socket file ownership is set to root:root (Automated)
[INFO]       * File not found
[INFO] 3.24 - Ensure that the Containerd socket file permissions are set to 660 or more restrictively (Automated)
[INFO]       * File not found

[INFO] 4 - Container Images and Build File
[INFO] 4.1 - Ensure that a user for the container has been created (Automated)
[INFO]      * No containers running
[NOTE] 4.2 - Ensure that containers use only trusted base images (Manual)
[NOTE] 4.3 - Ensure that unnecessary packages are not installed in the container (Manual)
[NOTE] 4.4 - Ensure images are scanned and rebuilt to include security patches (Manual)
[WARN] 4.5 - Ensure Content trust for Docker is Enabled (Automated)
[WARN] 4.6 - Ensure that HEALTHCHECK instructions have been added to container images (Automated)
[WARN]      * No Healthcheck found: [places-presentation:1.0.0]
[WARN]      * No Healthcheck found: f8248b6ebfb6
[WARN]      * No Healthcheck found: [places-api:1.0.0]
[WARN]      * No Healthcheck found: 4fab69b28e1e
[WARN]      * No Healthcheck found: 1ccc17eab133
[WARN]      * No Healthcheck found: a70d710d0314
[WARN]      * No Healthcheck found: a49cea83d080
[WARN]      * No Healthcheck found: 5cfb68811822
[WARN]      * No Healthcheck found: [elasticsearch:7.6.2]
[INFO] 4.7 - Ensure update instructions are not used alone in the Dockerfile (Manual)
[INFO]      * Update instruction found: [places-api:1.0.0]
[NOTE] 4.8 - Ensure setuid and setgid permissions are removed (Manual)
[PASS] 4.9 - Ensure that COPY is used instead of ADD in Dockerfiles (Manual)
[NOTE] 4.10 - Ensure secrets are not stored in Dockerfiles (Manual)
[NOTE] 4.11 - Ensure only verified packages are installed (Manual)
[NOTE] 4.12 - Ensure all signed artifacts are validated (Manual)

[INFO] 5 - Container Runtime
[INFO]   * No containers running, skipping Section 5
[PASS] 5.1 - Ensure swarm mode is not Enabled, if not needed (Automated)

[INFO] 6 - Docker Security Operations
[INFO] 6.1 - Ensure that image sprawl is avoided (Manual)
[INFO]      * There are currently: 9 images
[INFO] 6.2 - Ensure that container sprawl is avoided (Manual)
[INFO]      * There are currently a total of 4 containers, with 0 of them currently running

[INFO] 7 - Docker Swarm Configuration
[PASS] 7.1 - Ensure that the minimum number of manager nodes have been created in a swarm (Automated) (Swarm mode not enabled)
[PASS] 7.2 - Ensure that swarm services are bound to a specific host interface (Automated) (Swarm mode not enabled)
[PASS] 7.3 - Ensure that all Docker swarm overlay networks are encrypted (Automated)
[PASS] 7.4 - Ensure that Docker's secret management commands are used for managing secrets in a swarm cluster (Manual) (Swarm mode not enabled)
[PASS] 7.5 - Ensure that swarm manager is run in auto-lock mode (Automated) (Swarm mode not enabled)
[PASS] 7.6 - Ensure that the swarm manager auto-lock key is rotated periodically (Manual) (Swarm mode not enabled)
[PASS] 7.7 - Ensure that node certificates are rotated as appropriate (Manual) (Swarm mode not enabled)
[PASS] 7.8 - Ensure that CA certificates are rotated as appropriate (Manual) (Swarm mode not enabled)
[PASS] 7.9 - Ensure that management plane traffic is separated from data plane traffic (Manual) (Swarm mode not enabled)


Section C - Score

[INFO] Checks: 86
[INFO] Score: 1
```

**Меры по устранению уязвимостей**
- [WARN] 1.1.1 - Ensure a separate partition for containers has been created (Automated). 
Решение: хранить образы docker в отдельном разделе ОС
- [WARN] 1.1.3-4 - Ensure auditing is configured for the Docker daemon (Automated). Решение: изменить права службы docker, сделать не root
- [WARN] 2.2 - Ensure network traffic is restricted between containers on the default bridge (Scored). 
Решение: ограничиваем межконтейнерное взаимодействие: <code>dockerd --icc=false</code>
- [WARN] 2.9 - Enable user namespace support (Scored). 
Решение: создание отдельного пользователя для Docker
- [WARN] 2.12 - Ensure that authorization for Docker client commands is enabled (Scored). 
Решение: Установка/разработка плагина авторизации в docker <code>dockerd --authorization-plugin=PLUGIN_ID</code>
- [WARN] 2.13 - Ensure centralized and remote logging is configured (Scored). Решение: включение центрального и удаленного логирования <code>dockerd --log-driver=syslog --log-opt syslog-address=tcp://192.xxx.xxx.xxx</code>

- [WARN] 2.14 - Ensure containers are restricted from acquiring new privileges (Scored). 
Решение: Для запрета получения привилегий <code>dockerd --no-new-privileges</code>

- [WARN] 2.15 - Ensure live restore is enabled (Scored). 
Решение: для обеспечения непрерывной работы контейнера: <code>dockerd --live-restore</code>

- [WARN] 2.16 - Ensure Userland Proxy is Disabled (Scored). 
Решение: <code>dockerd --userland-proxy=false</code>

- [WARN] 4.5 - Ensure Content trust for Docker is Enabled (Automated). Решение: <code>export DOCKER_CONTENT_TRUST=1</code>

- [WARN] 4.6 - Ensure that HEALTHCHECK instructions have been added to container images (Automated). 
Решение: Включить проверку здоровья контейнера