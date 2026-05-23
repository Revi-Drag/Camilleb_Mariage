<?php

/**
 * Contrôleur API client pour la gestion des tâches.
 * Permet au client connecté de consulter les tâches liées à ses projets.
 */

namespace App\Controller\Api;

use App\Entity\ProjetMariage;
use App\Entity\Tache;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/client/taches')]
#[IsGranted('ROLE_CLIENT')]
final class ClientTacheController extends AbstractController
{
    // [CT-01] LISTER LES TÂCHES DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_taches_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $taches = [];

        foreach ($user->getProjetsMariage() as $projet) {
            foreach ($projet->getTaches() as $tache) {
                $taches[] = [
                    'id' => $tache->getId(),
                    'titre' => $tache->getTitre(),
                    'description' => $tache->getDescription(),
                    'statut' => $tache->getStatut(),
                    'dateEcheance' => $tache->getDateEcheance()?->format('Y-m-d H:i:s'),
                    'commentaireAdmin' => $tache->getCommentaireAdmin(),
                    'projetMariage' => [
                        'id' => $projet->getId(),
                        'nom' => $projet->getNom(),
                    ],
                ];
            }
        }

        return $this->json($taches);
    }

    // [CT-02] AJOUTER UNE TÂCHE AU PROJET DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_taches_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (
            !$data ||
            empty($data['titre']) ||
            empty($data['projetMariageId'])
        ) {
            return $this->json([
                'success' => false,
                'error' => 'Champs obligatoires manquants : titre, projetMariageId.'
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

        $statut = $data['statut'] ?? 'a_faire';
        $statutsAutorises = ['a_faire', 'terminee'];

        if (!in_array($statut, $statutsAutorises, true)) {
            return $this->json([
                'success' => false,
                'error' => 'Statut invalide. Valeurs autorisées : a_faire, terminee.'
            ], 400);
        }

        $tache = new Tache();
        $tache->setTitre($data['titre']);
        $tache->setDescription($data['description'] ?? null);
        $tache->setStatut($statut);
        $tache->setCommentaireAdmin($data['commentaireAdmin'] ?? null);
        $tache->setProjetMariage($projet);

        if (!empty($data['dateEcheance'])) {
            try {
                $tache->setDateEcheance(new \DateTimeImmutable($data['dateEcheance']));
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'error' => 'Format de dateEcheance invalide.'
                ], 400);
            }
        }

        $entityManager->persist($tache);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Tâche créée avec succès.',
            'tache' => [
                'id' => $tache->getId(),
                'titre' => $tache->getTitre(),
                'description' => $tache->getDescription(),
                'statut' => $tache->getStatut(),
                'dateEcheance' => $tache->getDateEcheance()?->format('Y-m-d H:i:s'),
                'commentaireAdmin' => $tache->getCommentaireAdmin(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ], 201);
    }

    // [CT-03] METTRE À JOUR UNE TÂCHE DU CLIENT CONNECTÉ
    #[Route('/{id}', name: 'api_client_taches_update', methods: ['PATCH'])]
    public function update(
        Request $request,
        Tache $tache,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $projet = $tache->getProjetMariage();

        if (!$user->getProjetsMariage()->contains($projet)) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à cette tâche.'
            ], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'error' => 'Données JSON invalides.'
            ], 400);
        }

        if (isset($data['titre'])) {
            $tache->setTitre($data['titre']);
        }

        if (array_key_exists('description', $data)) {
            $tache->setDescription($data['description']);
        }

        if (isset($data['statut'])) {
            $statutsAutorises = ['a_faire', 'terminee'];

            if (!in_array($data['statut'], $statutsAutorises, true)) {
                return $this->json([
                    'success' => false,
                    'error' => 'Statut invalide. Valeurs autorisées : a_faire, terminee.'
                ], 400);
            }

            $tache->setStatut($data['statut']);
        }

        if (array_key_exists('dateEcheance', $data)) {
            if ($data['dateEcheance'] === null || $data['dateEcheance'] === '') {
                $tache->setDateEcheance(null);
            } else {
                try {
                    $tache->setDateEcheance(new \DateTimeImmutable($data['dateEcheance']));
                } catch (\Exception $e) {
                    return $this->json([
                        'success' => false,
                        'error' => 'Format de dateEcheance invalide.'
                    ], 400);
                }
            }
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Tâche mise à jour avec succès.',
            'tache' => [
                'id' => $tache->getId(),
                'titre' => $tache->getTitre(),
                'description' => $tache->getDescription(),
                'statut' => $tache->getStatut(),
                'dateEcheance' => $tache->getDateEcheance()?->format('Y-m-d H:i:s'),
                'commentaireAdmin' => $tache->getCommentaireAdmin(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ]);
    }

    // [CT-04] SUPPRIMER UNE TÂCHE DU CLIENT CONNECTÉ
    #[Route('/{id}', name: 'api_client_taches_delete', methods: ['DELETE'])]
    public function delete(
        Tache $tache,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $projet = $tache->getProjetMariage();

        if (!$user->getProjetsMariage()->contains($projet)) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à cette tâche.'
            ], 403);
        }

        $entityManager->remove($tache);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Tâche supprimée avec succès.'
        ]);
    }
}