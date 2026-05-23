<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422143326 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE invite (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, email VARCHAR(255) DEFAULT NULL, telephone VARCHAR(50) DEFAULT NULL, statut VARCHAR(50) NOT NULL, regime_alimentaire VARCHAR(255) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, projet_mariage_id INT NOT NULL, INDEX IDX_C7E210D7800F6911 (projet_mariage_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE invite ADD CONSTRAINT FK_C7E210D7800F6911 FOREIGN KEY (projet_mariage_id) REFERENCES projet_mariage (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE invite DROP FOREIGN KEY FK_C7E210D7800F6911');
        $this->addSql('DROP TABLE invite');
    }
}
