FROM python:2.7-alpine
EXPOSE 11111
COPY requirements.txt /
COPY socketServer.py /
RUN pip install -r /requirements.txt
RUN adduser -D -u 1234 python
USER python
CMD [ "python", "/socketServer.py" ]
