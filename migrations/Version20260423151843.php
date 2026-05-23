<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260423151843 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tache (id INT AUTO_INCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, statut VARCHAR(50) NOT NULL, date_echeance DATETIME DEFAULT NULL, commentaire_admin LONGTEXT DEFAULT NULL, projet_mariage_id INT NOT NULL, INDEX IDX_93872075800F6911 (projet_mariage_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE tache ADD CONSTRAINT FK_93872075800F6911 FOREIGN KEY (projet_mariage_id) REFERENCES projet_mariage (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tache DROP FOREIGN KEY FK_93872075800F6911');
        $this->addSql('DROP TABLE tache');
    }
}
