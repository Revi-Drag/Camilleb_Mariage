<?php


/**
 * Contrôleur API admin pour la gestion des projets mariage.
 * Permet à l'administrateur de lister, consulter, créer, mettre à jour et supprimer des projets mariage.
 */


namespace App\Controller\Api;

use App\Entity\ProjetMariage;
use App\Entity\User;
use App\Repository\ProjetMariageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/projets')]
#[IsGranted('ROLE_ADMIN')]
final class AdminProjetMariageController extends AbstractController
{
    // [AP-01] LISTER LES PROJETS MARIAGE
    #[Route('', name: 'api_admin_projets_list', methods: ['GET'])]
    public function list(ProjetMariageRepository $projetMariageRepository): JsonResponse
    {
        $projets = $projetMariageRepository->findAll();

        $data = array_map(function ($projet) {
            return [
                'id' => $projet->getId(),
                'nom' => $projet->getNom(),
                'dateMariage' => $projet->getDateMariage()?->format('Y-m-d H:i:s'),
                'budget' => $projet->getBudget(),
                'description' => $projet->getDescription(),
                'statut' => $projet->getStatut(),
                'commentaireAdmin' => $projet->getCommentaireAdmin(),
                'clients' => array_map(function ($client) {
                    return [
                        'id' => $client->getId(),
                        'email' => $client->getEmail(),
                        'roles' => $client->getRoles(),
                    ];
                }, $projet->getClients()->toArray()),
            ];
        }, $projets);

        return $this->json($data);
    }

    // [AP-02] AFFICHER LE DÉTAIL D'UN PROJET MARIAGE
    #[Route('/{id}', name: 'api_admin_projets_show', methods: ['GET'])]
    public function show(ProjetMariage $projet): JsonResponse
    {
        return $this->json([
            'id' => $projet->getId(),
            'nom' => $projet->getNom(),
            'dateMariage' => $projet->getDateMariage()?->format('Y-m-d H:i:s'),
            'budget' => $projet->getBudget(),
            'description' => $projet->getDescription(),
            'statut' => $projet->getStatut(),
            'commentaireAdmin' => $projet->getCommentaireAdmin(),
            'clients' => array_map(function ($client) {
                return [
                    'id' => $client->getId(),
                    'email' => $client->getEmail(),
                    'roles' => $client->getRoles(),
                ];
            }, $projet->getClients()->toArray()),
        ]);
    }

    // [AP-03] CRÉER UN PROJET MARIAGE
    #[Route('', name: 'api_admin_projets_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (
            !$data ||
            empty($data['nom']) ||
            empty($data['dateMariage']) ||
            empty($data['clientIds']) ||
            !is_array($data['clientIds'])
        ) {
            return $this->json([
                'success' => false,
                'error' => 'Champs obligatoires manquants : nom, dateMariage, clientIds.'
            ], 400);
        }

        if (count($data['clientIds']) < 1 || count($data['clientIds']) > 2) {
            return $this->json([
                'success' => false,
                'error' => 'Un projet mariage doit être lié à 1 ou 2 clients.'
            ], 400);
        }

        try {
            $dateMariage = new \DateTimeImmutable($data['dateMariage']);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'Format de date invalide.'
            ], 400);
        }

        $clients = [];
        foreach ($data['clientIds'] as $clientId) {
            $client = $entityManager->getRepository(User::class)->find($clientId);

            if (!$client) {
                return $this->json([
                    'success' => false,
                    'error' => sprintf('Utilisateur introuvable pour l’id %s.', $clientId)
                ], 404);
            }

            if (!in_array('ROLE_CLIENT', $client->getRoles(), true)) {
                return $this->json([
                    'success' => false,
                    'error' => sprintf('L’utilisateur %s n’a pas le rôle ROLE_CLIENT.', $client->getEmail())
                ], 400);
            }

            $clients[] = $client;
        }

        $projet = new ProjetMariage();
        $projet->setNom($data['nom']);
        $projet->setDateMariage($dateMariage);
        $projet->setBudget(isset($data['budget']) ? (float) $data['budget'] : null);
        $projet->setDescription($data['description'] ?? null);
        $projet->setStatut($data['statut'] ?? 'en_attente');
        $projet->setCommentaireAdmin($data['commentaireAdmin'] ?? null);

        foreach ($clients as $client) {
            $projet->addClient($client);
        }

        $entityManager->persist($projet);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Projet mariage créé avec succès.',
            'projet' => [
                'id' => $projet->getId(),
                'nom' => $projet->getNom(),
                'dateMariage' => $projet->getDateMariage()?->format('Y-m-d H:i:s'),
                'budget' => $projet->getBudget(),
                'description' => $projet->getDescription(),
                'statut' => $projet->getStatut(),
                'commentaireAdmin' => $projet->getCommentaireAdmin(),
                'clients' => array_map(function ($client) {
                    return [
                        'id' => $client->getId(),
                        'email' => $client->getEmail(),
                        'roles' => $client->getRoles(),
                    ];
                }, $projet->getClients()->toArray()),
            ]
        ], 201);
    }

    // [AP-04] METTRE À JOUR UN PROJET MARIAGE
    #[Route('/{id}', name: 'api_admin_projets_update', methods: ['PATCH'])]
    public function update(
        Request $request,
        ProjetMariage $projet,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'error' => 'Données JSON invalides.'
            ], 400);
        }

        if (isset($data['nom'])) {
            $projet->setNom($data['nom']);
        }

        if (isset($data['dateMariage'])) {
            try {
                $projet->setDateMariage(new \DateTimeImmutable($data['dateMariage']));
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'error' => 'Format de date invalide.'
                ], 400);
            }
        }

        if (array_key_exists('budget', $data)) {
            $projet->setBudget($data['budget'] !== null ? (float) $data['budget'] : null);
        }

        if (array_key_exists('description', $data)) {
            $projet->setDescription($data['description']);
        }

        if (isset($data['statut'])) {
            $statutsAutorises = ['en_attente', 'en_traitement', 'finalise'];

            if (!in_array($data['statut'], $statutsAutorises, true)) {
                return $this->json([
                    'success' => false,
                    'error' => 'Statut invalide. Valeurs autorisées : en_attente, en_traitement, finalise.'
                ], 400);
            }

            $projet->setStatut($data['statut']);
        }

        if (array_key_exists('commentaireAdmin', $data)) {
            $projet->setCommentaireAdmin($data['commentaireAdmin']);
        }

        if (isset($data['clientIds'])) {
            if (!is_array($data['clientIds']) || count($data['clientIds']) < 1 || count($data['clientIds']) > 2) {
                return $this->json([
                    'success' => false,
                    'error' => 'Un projet mariage doit être lié à 1 ou 2 clients.'
                ], 400);
            }

            foreach ($projet->getClients()->toArray() as $existingClient) {
                $projet->removeClient($existingClient);
            }

            foreach ($data['clientIds'] as $clientId) {
                $client = $entityManager->getRepository(User::class)->find($clientId);

                if (!$client) {
                    return $this->json([
                        'success' => false,
                        'error' => sprintf('Utilisateur introuvable pour l’id %s.', $clientId)
                    ], 404);
                }

                if (!in_array('ROLE_CLIENT', $client->getRoles(), true)) {
                    return $this->json([
                        'success' => false,
                        'error' => sprintf('L’utilisateur %s n’a pas le rôle ROLE_CLIENT.', $client->getEmail())
                    ], 400);
                }

                $projet->addClient($client);
            }
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Projet mariage mis à jour avec succès.',
            'projet' => [
                'id' => $projet->getId(),
                'nom' => $projet->getNom(),
                'dateMariage' => $projet->getDateMariage()?->format('Y-m-d H:i:s'),
                'budget' => $projet->getBudget(),
                'description' => $projet->getDescription(),
                'statut' => $projet->getStatut(),
                'commentaireAdmin' => $projet->getCommentaireAdmin(),
                'clients' => array_map(function ($client) {
                    return [
                        'id' => $client->getId(),
                        'email' => $client->getEmail(),
                        'roles' => $client->getRoles(),
                    ];
                }, $projet->getClients()->toArray()),
            ]
        ]);
    }

    // [AP-05] SUPPRIMER UN PROJET MARIAGE
    #[Route('/{id}', name: 'api_admin_projets_delete', methods: ['DELETE'])]
    public function delete(
        ProjetMariage $projet,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $entityManager->remove($projet);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Projet mariage supprimé avec succès.'
        ]);
    }
}