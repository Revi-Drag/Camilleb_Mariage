<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260423155814 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE budget (id INT AUTO_INCREMENT NOT NULL, montant_prevu DOUBLE PRECISION DEFAULT NULL, montant_depense DOUBLE PRECISION DEFAULT NULL, notes LONGTEXT DEFAULT NULL, commentaire_admin LONGTEXT DEFAULT NULL, projet_mariage_id INT NOT NULL, UNIQUE INDEX UNIQ_73F2F77B800F6911 (projet_mariage_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE budget ADD CONSTRAINT FK_73F2F77B800F6911 FOREIGN KEY (projet_mariage_id) REFERENCES projet_mariage (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE budget DROP FOREIGN KEY FK_73F2F77B800F6911');
        $this->addSql('DROP TABLE budget');
    }
}
