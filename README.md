# 7_Sem_DevOps

## [Практика 1](<Practise_1>)

### Управление плейбуками ansible с помощью Semaphore

Перейтив в [директорию практики](<Practise_1>):

```bash
cd "Practise 2"
```

Запустить файл [docker-compose.yml](<Practise_1/docker-compose.yml>):

```bash
sudo docker compose up --build
```

Логин пароль по умолчанию:
```
admin
AdminPassword
```

В качестве тестового примера предлагается следующий [плейбук](<Practise_1/ansible-playbook.yml>) для развёртывание тестового веб-сервера nginx. Он расчитан на использование в локальном репозитории плейбуков. Для того, чтобы данный файл было видно внутри контейнера, необходимо раскомментировать следюущую строку в [docker-compose.yml](<Practise_1/docker-compose.yml>):

- *Было*

```yaml
volumes:
    - semaphore_data:/tmp/semaphore
    # - /home/admuser/playbooks:/opt/ansible/playbooks:ro # локальный репозиторий плейбуков
```
- *Должно стать*

```yaml
volumes:
    - semaphore_data:/tmp/semaphore
    - /home/admuser/playbooks:/opt/ansible/playbooks:ro # локальный репозиторий плейбуков
```

Далее необходимо переместить [плейбук](<Practise_1/ansible-playbook.yml>) в указанную директорию (которая стоит перед `:`).

- *Важно отметить, что можно использовать собственную директорию, для этого нужно заменить текущий полный путь на свой.*

```yaml
volumes:
    - semaphore_data:/tmp/semaphore
    - /custom_dir/playbooks:/opt/ansible/playbooks:ro # локальный репозиторий плейбуков
```

## [Практика 2](<Practise 2>)

### Запуск продакшн стека с помощью Docker

Стек состоит из PostgreSQL, бэкенда на Go, фронтенда на Node.js, шлюза nginx с HTTPS и необязательного Adminer.

#### Требования

- Docker Engine и Docker Compose;
- Docker BuildKit/buildx;
- OpenSSL для генерации self-signed сертификата;
- Go 1.22+ только для локального запуска тестов вне Docker.

#### Подготовка локальных файлов

Перейти в [директорию практики](<Practise_2>):

```bash
cd "Practise 2"
```

Секреты и сертификаты не хранятся в Git. Их нужно создать на каждой машине отдельно:

```bash
cp .env.example .env
printf '1.0.0\n' > release-version.txt
bash nginx/generate-cert.sh
```

В `.env` необходимо заменить значение `DB_PASSWORD` на собственный пароль.

#### Production запуск

Проверка конфигурации:

```bash
sudo docker compose -f docker-compose.yml config
```

Запуск стека:

```bash
sudo env DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose -f docker-compose.yml up --build
```

Проверить запущенные контейнеры можно командой:

```bash
sudo docker compose -f docker-compose.yml ps
```

BuildKit secrets используются Compose для версии выпуска фронтенда и TLS-сертификатов nginx.

#### Проверка приложения

```bash
curl -I http://localhost
curl -k https://localhost:8443/health
curl -k https://localhost:8443/api/notes
curl -k -X POST https://localhost:8443/api/notes -H 'Content-Type: application/json' -d '{"title":"Заметка curl","body":"Создано с помощью curl"}'
curl -k -X DELETE https://localhost:8443/api/notes/1
openssl s_client -connect localhost:8443 -showcerts
```

Фронтенд доступен по адресу `https://localhost:8443`. Стоит отметить, что так как сертификата является самоподписанным, то браузер покажет предупреждение.

#### Adminer

Adminer запускается через профиль debug и подключается к PostgreSQL по имени сервиса db внутри сети Compose:

```bash
sudo DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose -f docker-compose.yml --profile debug up --build
```

Adminer подключается к PostgreSQL по имени сервиса `db` внутри сети Compose.

После запуска открыть `http://localhost:8081` и указать:

| Поле Adminer | Значение |
| --- | --- |
| Система | `PostgreSQL` |
| Сервер | `db` |
| Пользователь | `notes` |
| Пароль | значение `DB_PASSWORD` из `.env` |
| База данных | `notes` |

Важно использовать `db`, а не `localhost`: Adminer работает в отдельном контейнере и обращается к PostgreSQL через DNS-имя Compose-сервиса.

Остановить только Adminer:

```bash
sudo docker compose -f docker-compose.yml --profile debug stop adminer
```

Проверить его состояние:

```bash
sudo docker compose -f docker-compose.yml --profile debug ps adminer
```

#### Debug-режим

Debug override отключает TLS для nginx, публикует HTTP на `8080` и backend на `8000`:

```bash
sudo DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

Проверить debug-сервисы:

```bash
curl http://localhost:8080/healthz
curl http://localhost:8080/health
curl http://localhost:8000/health
```

#### Диагностика

```bash
sudo docker compose ps -a
sudo docker compose logs backend
sudo docker compose logs nginx
sudo docker inspect <container>
sudo docker stats
sudo docker top <container>
sudo docker events
sudo docker system df
```

Проверка graceful shutdown:

```bash
sudo docker compose stop backend
sudo docker compose logs backend
```

В логах ожидаются `SIGTERM received, shutting down gracefully...` и `server stopped`.

Остановить стек без удаления volume PostgreSQL:

```bash
sudo docker compose down
```
