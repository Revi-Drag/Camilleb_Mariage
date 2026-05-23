<?php

namespace App\Entity;

use App\Repository\BudgetRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BudgetRepository::class)]
class Budget
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(nullable: true)]
    private ?float $montantPrevu = null;

    #[ORM\Column(nullable: true)]
    private ?float $montantDepense = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $commentaireAdmin = null;

    #[ORM\OneToOne(inversedBy: 'budgetDetail', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?ProjetMariage $projetMariage = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMontantPrevu(): ?float
    {
        return $this->montantPrevu;
    }

    public function setMontantPrevu(?float $montantPrevu): static
    {
        $this->montantPrevu = $montantPrevu;

        return $this;
    }

    public function getMontantDepense(): ?float
    {
        return $this->montantDepense;
    }

    public function setMontantDepense(?float $montantDepense): static
    {
        $this->montantDepense = $montantDepense;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getCommentaireAdmin(): ?string
    {
        return $this->commentaireAdmin;
    }

    public function setCommentaireAdmin(?string $commentaireAdmin): static
    {
        $this->commentaireAdmin = $commentaireAdmin;

        return $this;
    }

    public function getProjetMariage(): ?ProjetMariage
    {
        return $this->projetMariage;
    }

    public function setProjetMariage(ProjetMariage $projetMariage): static
    {
        $this->projetMariage = $projetMariage;

        return $this;
    }
}
