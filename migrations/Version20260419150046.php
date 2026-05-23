<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260419150046 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE projet_mariage (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, date_mariage DATETIME NOT NULL, budget DOUBLE PRECISION DEFAULT NULL, description LONGTEXT DEFAULT NULL, user_id INT NOT NULL, INDEX IDX_ADC2B153A76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE projet_mariage ADD CONSTRAINT FK_ADC2B153A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE projet_mariage DROP FOREIGN KEY FK_ADC2B153A76ED395');
        $this->addSql('DROP TABLE projet_mariage');
    }
}
