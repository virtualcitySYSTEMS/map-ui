FROM httpd:2-buster
COPY . /usr/local/apache2/htdocs/
RUN sed -i -E 's/^#(LoadModule (headers|rewrite|proxy|proxy_http|ssl)_module )/\1/' /usr/local/apache2/conf/httpd.conf \
	&& printf '\n<Directory "/usr/local/apache2/htdocs">\n    AllowOverride FileInfo\n</Directory>\nSSLProxyEngine On\n' >> /usr/local/apache2/conf/httpd.conf