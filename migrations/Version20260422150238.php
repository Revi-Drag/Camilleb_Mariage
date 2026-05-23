<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260422150238 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE projet_mariage_clients (projet_mariage_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_FDBC9BA0800F6911 (projet_mariage_id), INDEX IDX_FDBC9BA0A76ED395 (user_id), PRIMARY KEY (projet_mariage_id, user_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE projet_mariage_clients ADD CONSTRAINT FK_FDBC9BA0800F6911 FOREIGN KEY (projet_mariage_id) REFERENCES projet_mariage (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE projet_mariage_clients ADD CONSTRAINT FK_FDBC9BA0A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE projet_mariage DROP FOREIGN KEY `FK_ADC2B153A76ED395`');
        $this->addSql('DROP INDEX IDX_ADC2B153A76ED395 ON projet_mariage');
        $this->addSql('ALTER TABLE projet_mariage DROP user_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE projet_mariage_clients DROP FOREIGN KEY FK_FDBC9BA0800F6911');
        $this->addSql('ALTER TABLE projet_mariage_clients DROP FOREIGN KEY FK_FDBC9BA0A76ED395');
        $this->addSql('DROP TABLE projet_mariage_clients');
        $this->addSql('ALTER TABLE projet_mariage ADD user_id INT NOT NULL');
        $this->addSql('ALTER TABLE projet_mariage ADD CONSTRAINT `FK_ADC2B153A76ED395` FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('CREATE INDEX IDX_ADC2B153A76ED395 ON projet_mariage (user_id)');
    }
}
