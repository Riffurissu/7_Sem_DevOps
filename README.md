# 7_Sem_DevOps

## [Практика 1](<Practise 1>)

### Управление плейбуками ansible с помощью Semaphore

Скопировать  в директорию по пути `/home/admuser/playbooks/`

Запустить [файл docker-compose.yml](<Practise 1/docker-compose.yml>):

```bash
sudo docker compose up --build
```

Логин пароль по умолчанию:
```
admin
AdminPassword
```

В качестве тестового примера предлагается следующий [плейбук для развёртывание тестового веб-сервера nginx](<Practise 1/ansible-playbook.yml>). Он расчитан на использование в локальном репозитории плейбуков. Для того, чтобы данный файл было видно внутри контейнера, необходимо раскомментировать следюущую строку в [docker-compose.yml](<Practise 1/docker-compose.yml>):

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

Далее необходимо переместить [плейбук](<Practise 1/ansible-playbook.yml>) в указанную директорию (которая стоит перед `:`).

- *Важно отметить, что можно использовать собственную директорию, для этого нужно заменить текущий полный путь на свой.*

```yaml
volumes:
    - semaphore_data:/tmp/semaphore
    - /custom_dir/playbooks:/opt/ansible/playbooks:ro # локальный репозиторий плейбуков
```