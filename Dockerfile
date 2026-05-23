FROM php:8.4-apache

ENV APP_ENV=prod
ENV APP_DEBUG=0

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        libzip-dev \
        libonig-dev \
        default-mysql-client \
    && docker-php-ext-install \
        intl \
        pdo \
        pdo_mysql \
        zip \
        opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/apache/vhost.conf /etc/apache2/sites-available/000-default.conf

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --no-scripts \
    && mkdir -p var/cache/prod var/log public/uploads/documents \
    && chmod -R 775 var public/uploads \
    && chown -R www-data:www-data var public/uploads

USER www-data

USER root

EXPOSE 80

CMD ["sh", "-c", "mkdir -p var/cache/prod var/log public/uploads/documents && chown -R www-data:www-data var public/uploads && chmod -R 775 var public/uploads && apache2-foreground"]