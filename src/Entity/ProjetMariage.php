<?php

namespace App\Entity;

use App\Repository\ProjetMariageRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProjetMariageRepository::class)]
class ProjetMariage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateMariage = null;

    #[ORM\Column(nullable: true)]
    private ?float $budget = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    private ?string $statut = 'en_attente';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $commentaireAdmin = null;

    /**
     * @var Collection<int, User>
     */
    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'projetsMariage')]
    #[ORM\JoinTable(name: 'projet_mariage_clients')]
    private Collection $clients;

    /**
     * @var Collection<int, Invite>
     */
    #[ORM\OneToMany(targetEntity: Invite::class, mappedBy: 'projetMariage')]
    private Collection $invites;

    /**
     * @var Collection<int, Tache>
     */
    #[ORM\OneToMany(targetEntity: Tache::class, mappedBy: 'projetMariage')]
    private Collection $taches;

    #[ORM\OneToOne(mappedBy: 'projetMariage', cascade: ['persist', 'remove'])]
    private ?Budget $budgetDetail = null;

    /**
     * @var Collection<int, Document>
     */
    #[ORM\OneToMany(targetEntity: Document::class, mappedBy: 'projetMariage')]
    private Collection $documents;

    public function __construct()
    {
        $this->clients = new ArrayCollection();
        $this->invites = new ArrayCollection();
        $this->statut = 'en_attente';
        $this->taches = new ArrayCollection();
        $this->documents = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getDateMariage(): ?\DateTimeImmutable
    {
        return $this->dateMariage;
    }

    public function setDateMariage(\DateTimeImmutable $dateMariage): static
    {
        $this->dateMariage = $dateMariage;

        return $this;
    }

    public function getBudget(): ?float
    {
        return $this->budget;
    }

    public function setBudget(?float $budget): static
    {
        $this->budget = $budget;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

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

    /**
     * @return Collection<int, User>
     */
    public function getClients(): Collection
    {
        return $this->clients;
    }

    public function addClient(User $client): static
    {
        if (!$this->clients->contains($client)) {
            $this->clients->add($client);
        }

        return $this;
    }

    public function removeClient(User $client): static
    {
        $this->clients->removeElement($client);

        return $this;
    }

    /**
     * @return Collection<int, Invite>
     */
    public function getInvites(): Collection
    {
        return $this->invites;
    }

    public function addInvite(Invite $invite): static
    {
        if (!$this->invites->contains($invite)) {
            $this->invites->add($invite);
            $invite->setProjetMariage($this);
        }

        return $this;
    }

    public function removeInvite(Invite $invite): static
    {
        if ($this->invites->removeElement($invite)) {
            if ($invite->getProjetMariage() === $this) {
                $invite->setProjetMariage(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Tache>
     */
    public function getTaches(): Collection
    {
        return $this->taches;
    }

    public function addTache(Tache $tache): static
    {
        if (!$this->taches->contains($tache)) {
            $this->taches->add($tache);
            $tache->setProjetMariage($this);
        }

        return $this;
    }

    public function removeTache(Tache $tache): static
    {
        if ($this->taches->removeElement($tache)) {
            // set the owning side to null (unless already changed)
            if ($tache->getProjetMariage() === $this) {
                $tache->setProjetMariage(null);
            }
        }

        return $this;
    }

    public function getBudgetDetail(): ?Budget
    {
        return $this->budgetDetail;
    }

    public function setBudgetDetail(Budget $budgetDetail): static
    {
        // set the owning side of the relation if necessary
        if ($budgetDetail->getProjetMariage() !== $this) {
            $budgetDetail->setProjetMariage($this);
        }

        $this->budgetDetail = $budgetDetail;

        return $this;
    }

    /**
     * @return Collection<int, Document>
     */
    public function getDocuments(): Collection
    {
        return $this->documents;
    }

    public function addDocument(Document $document): static
    {
        if (!$this->documents->contains($document)) {
            $this->documents->add($document);
            $document->setProjetMariage($this);
        }

        return $this;
    }

    public function removeDocument(Document $document): static
    {
        if ($this->documents->removeElement($document)) {
            // set the owning side to null (unless already changed)
            if ($document->getProjetMariage() === $this) {
                $document->setProjetMariage(null);
            }
        }

        return $this;
    }
}