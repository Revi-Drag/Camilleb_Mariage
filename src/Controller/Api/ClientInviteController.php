<?php

/**
 * Contrôleur API client pour la gestion des invités.
 * Permet au client connecté de consulter les invités liés à ses projets.
 */

namespace App\Controller\Api;

use App\Entity\Invite;
use App\Entity\ProjetMariage;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/client/invites')]
#[IsGranted('ROLE_CLIENT')]
final class ClientInviteController extends AbstractController
{
    // [CI-01] LISTER LES INVITÉS DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_invites_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $invites = [];

        foreach ($user->getProjetsMariage() as $projet) {
            foreach ($projet->getInvites() as $invite) {
                $invites[] = [
                    'id' => $invite->getId(),
                    'nom' => $invite->getNom(),
                    'email' => $invite->getEmail(),
                    'telephone' => $invite->getTelephone(),
                    'statut' => $invite->getStatut(),
                    'regimeAlimentaire' => $invite->getRegimeAlimentaire(),
                    'notes' => $invite->getNotes(),
                    'projetMariage' => [
                        'id' => $projet->getId(),
                        'nom' => $projet->getNom(),
                    ],
                ];
            }
        }

        return $this->json($invites);
    }

    // [CI-02] AJOUTER UN INVITÉ AU PROJET DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_invites_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (
            !$data ||
            empty($data['nom']) ||
            empty($data['projetMariageId'])
        ) {
            return $this->json([
                'success' => false,
                'error' => 'Champs obligatoires manquants : nom, projetMariageId.'
            ], 400);
        }

        $projet = $entityManager->getRepository(ProjetMariage::class)->find($data['projetMariageId']);

        if (!$projet) {
            return $this->json([
                'success' => false,
                'error' => 'Projet mariage introuvable.'
            ], 404);
        }

        if (!$user->getProjetsMariage()->contains($projet)) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à ce projet.'
            ], 403);
        }

        $statut = $data['statut'] ?? 'en_attente';
        $statutsAutorises = ['en_attente', 'confirme', 'refuse'];

        if (!in_array($statut, $statutsAutorises, true)) {
            return $this->json([
                'success' => false,
                'error' => 'Statut invalide. Valeurs autorisées : en_attente, confirme, refuse.'
            ], 400);
        }

        $invite = new Invite();
        $invite->setNom($data['nom']);
        $invite->setEmail($data['email'] ?? null);
        $invite->setTelephone($data['telephone'] ?? null);
        $invite->setStatut($statut);
        $invite->setRegimeAlimentaire($data['regimeAlimentaire'] ?? null);
        $invite->setNotes($data['notes'] ?? null);
        $invite->setProjetMariage($projet);

        $entityManager->persist($invite);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Invité créé avec succès.',
            'invite' => [
                'id' => $invite->getId(),
                'nom' => $invite->getNom(),
                'email' => $invite->getEmail(),
                'telephone' => $invite->getTelephone(),
                'statut' => $invite->getStatut(),
                'regimeAlimentaire' => $invite->getRegimeAlimentaire(),
                'notes' => $invite->getNotes(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ], 201);
    }

    // [CI-03] METTRE À JOUR UN INVITÉ DU CLIENT CONNECTÉ
    #[Route('/{id}', name: 'api_client_invites_update', methods: ['PATCH'])]
    public function update(
        Request $request,
        Invite $invite,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $projet = $invite->getProjetMariage();

        if (!$user->getProjetsMariage()->contains($projet)) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à cet invité.'
            ], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'error' => 'Données JSON invalides.'
            ], 400);
        }

        if (isset($data['nom'])) {
            $invite->setNom($data['nom']);
        }

        if (array_key_exists('email', $data)) {
            $invite->setEmail($data['email']);
        }

        if (array_key_exists('telephone', $data)) {
            $invite->setTelephone($data['telephone']);
        }

        if (isset($data['statut'])) {
            $statutsAutorises = ['en_attente', 'confirme', 'refuse'];

            if (!in_array($data['statut'], $statutsAutorises, true)) {
                return $this->json([
                    'success' => false,
                    'error' => 'Statut invalide. Valeurs autorisées : en_attente, confirme, refuse.'
                ], 400);
            }

            $invite->setStatut($data['statut']);
        }

        if (array_key_exists('regimeAlimentaire', $data)) {
            $invite->setRegimeAlimentaire($data['regimeAlimentaire']);
        }

        if (array_key_exists('notes', $data)) {
            $invite->setNotes($data['notes']);
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Invité mis à jour avec succès.',
            'invite' => [
                'id' => $invite->getId(),
                'nom' => $invite->getNom(),
                'email' => $invite->getEmail(),
                'telephone' => $invite->getTelephone(),
                'statut' => $invite->getStatut(),
                'regimeAlimentaire' => $invite->getRegimeAlimentaire(),
                'notes' => $invite->getNotes(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ]);
    }

    // [CI-04] SUPPRIMER UN INVITÉ DU CLIENT CONNECTÉ
    #[Route('/{id}', name: 'api_client_invites_delete', methods: ['DELETE'])]
    public function delete(
        Invite $invite,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $projet = $invite->getProjetMariage();

        if (!$user->getProjetsMariage()->contains($projet)) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à cet invité.'
            ], 403);
        }

        $entityManager->remove($invite);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Invité supprimé avec succès.'
        ]);
    }
}