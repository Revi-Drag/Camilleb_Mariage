FROM php:8.4-apache

# Set environment variables
ENV APP_ENV=prod
ENV APP_DEBUG=0

# Set the working directory
WORKDIR /var/www/html

# Install system dependencies and PHP extensions
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
    && a2enmod rewrite headers \index
    && rm -rf /var/lib/apt/lists/*

# Install Symfony binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configure Apache
COPY docker/apache/vhost.conf /etc/apache2/sites-available/000-default.conf

# Copy application files
COPY . .

# Set permissions for Symfony cache and log directories
ENV COMPOSER_ALLOW_SUPERUSER=1

# Install Symfony binary
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && mkdir -p var/cache/prod var/log public/uploads/documents \
    && chmod -R 775 var public/uploads \
    && chown -R www-data:www-data var public/uploads

# Switch to www-data user for better security
USER www-data

# Run Symfony cache warmup
USER root

# Expose port 80 for Apache
EXPOSE 80

CMD ["sh", "-c", "mkdir -p var/cache/prod var/log public/uploads/documents && chown -R www-data:www-data var public/uploads && chmod -R 775 var public/uploads && apache2-foreground"]