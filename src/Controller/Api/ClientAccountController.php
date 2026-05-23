<?php

/**
 * Contrôleur API client pour les informations de compte.
 * Permet au client connecté de consulter ses propres informations.
 */

namespace App\Controller\Api;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/client')]
#[IsGranted('ROLE_CLIENT')]
final class ClientAccountController extends AbstractController
{
    // [CC-01] AFFICHER LE COMPTE DU CLIENT CONNECTÉ
    #[Route('/me', name: 'api_client_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'projetsMariage' => array_map(function ($projet) {
                return [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                    'dateMariage' => $projet->getDateMariage()?->format('Y-m-d H:i:s'),
                    'statut' => $projet->getStatut(),
                ];
            }, $user->getProjetsMariage()->toArray()),
        ]);
    }

    // [CC-02] LISTER LES PROJETS DU CLIENT CONNECTÉ
    #[Route('/projets', name: 'api_client_projets_list', methods: ['GET'])]
    public function projets(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

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
                    ];
                }, $projet->getClients()->toArray()),
            ];
        }, $user->getProjetsMariage()->toArray());

        return $this->json($data);
    }
}