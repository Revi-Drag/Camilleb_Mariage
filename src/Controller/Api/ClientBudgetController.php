<?php

/**
 * Contrôleur API client pour la gestion du budget.
 * Permet au client connecté de consulter et créer le budget de ses projets.
 */

namespace App\Controller\Api;

use App\Entity\Budget;
use App\Entity\ProjetMariage;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/client/budget')]
#[IsGranted('ROLE_CLIENT')]
final class ClientBudgetController extends AbstractController
{
    // [CB-01] LISTER LES BUDGETS DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_budget_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $budgets = [];

        foreach ($user->getProjetsMariage() as $projet) {
            $budget = $projet->getBudgetDetail();

            if ($budget) {
                $budgets[] = [
                    'id' => $budget->getId(),
                    'montantPrevu' => $budget->getMontantPrevu(),
                    'montantDepense' => $budget->getMontantDepense(),
                    'ecart' => $budget->getMontantPrevu() !== null && $budget->getMontantDepense() !== null
                        ? $budget->getMontantPrevu() - $budget->getMontantDepense()
                        : null,
                    'notes' => $budget->getNotes(),
                    'commentaireAdmin' => $budget->getCommentaireAdmin(),
                    'projetMariage' => [
                        'id' => $projet->getId(),
                        'nom' => $projet->getNom(),
                    ],
                ];
            }
        }

        return $this->json($budgets);
    }

    // [CB-02] CRÉER LE BUDGET D’UN PROJET DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_budget_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (
            !$data ||
            empty($data['projetMariageId'])
        ) {
            return $this->json([
                'success' => false,
                'error' => 'Champ obligatoire manquant : projetMariageId.'
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

        if ($projet->getBudgetDetail()) {
            return $this->json([
                'success' => false,
                'error' => 'Un budget existe déjà pour ce projet.'
            ], 400);
        }

        $budget = new Budget();
        $budget->setMontantPrevu(isset($data['montantPrevu']) ? (float) $data['montantPrevu'] : null);
        $budget->setMontantDepense(isset($data['montantDepense']) ? (float) $data['montantDepense'] : null);
        $budget->setNotes($data['notes'] ?? null);
        $budget->setCommentaireAdmin($data['commentaireAdmin'] ?? null);
        $budget->setProjetMariage($projet);

        $entityManager->persist($budget);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Budget créé avec succès.',
            'budget' => [
                'id' => $budget->getId(),
                'montantPrevu' => $budget->getMontantPrevu(),
                'montantDepense' => $budget->getMontantDepense(),
                'ecart' => $budget->getMontantPrevu() !== null && $budget->getMontantDepense() !== null
                    ? $budget->getMontantPrevu() - $budget->getMontantDepense()
                    : null,
                'notes' => $budget->getNotes(),
                'commentaireAdmin' => $budget->getCommentaireAdmin(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ], 201);
    }

    // [CB-03] METTRE À JOUR LE BUDGET D’UN PROJET DU CLIENT CONNECTÉ
    #[Route('/{id}', name: 'api_client_budget_update', methods: ['PATCH'])]
    public function update(
        Request $request,
        Budget $budget,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $projet = $budget->getProjetMariage();

        if (!$user->getProjetsMariage()->contains($projet)) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à ce budget.'
            ], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'error' => 'Données JSON invalides.'
            ], 400);
        }

        if (array_key_exists('montantPrevu', $data)) {
            $budget->setMontantPrevu($data['montantPrevu'] !== null ? (float) $data['montantPrevu'] : null);
        }

        if (array_key_exists('montantDepense', $data)) {
            $budget->setMontantDepense($data['montantDepense'] !== null ? (float) $data['montantDepense'] : null);
        }

        if (array_key_exists('notes', $data)) {
            $budget->setNotes($data['notes']);
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Budget mis à jour avec succès.',
            'budget' => [
                'id' => $budget->getId(),
                'montantPrevu' => $budget->getMontantPrevu(),
                'montantDepense' => $budget->getMontantDepense(),
                'ecart' => $budget->getMontantPrevu() !== null && $budget->getMontantDepense() !== null
                    ? $budget->getMontantPrevu() - $budget->getMontantDepense()
                    : null,
                'notes' => $budget->getNotes(),
                'commentaireAdmin' => $budget->getCommentaireAdmin(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ]);
    }
}