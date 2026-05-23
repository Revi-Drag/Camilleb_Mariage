<?php

/**
 * Contrôleur API admin pour la gestion des clients.
 * Permet à l'administrateur de lister, consulter et créer des clients.
 */

namespace App\Controller\Api;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/clients')]
#[IsGranted('ROLE_ADMIN')]
final class AdminClientController extends AbstractController
{
    // [AC-01] LISTER LES CLIENTS
    #[Route('', name: 'api_admin_clients_list', methods: ['GET'])]
    public function list(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findAll();

        $clients = array_filter($users, function ($user) {
            return in_array('ROLE_CLIENT', $user->getRoles(), true);
        });

        $data = array_map(function ($client) {
            return [
                'id' => $client->getId(),
                'email' => $client->getEmail(),
                'roles' => $client->getRoles(),
                'projetsMariage' => array_map(function ($projet) {
                    return [
                        'id' => $projet->getId(),
                        'nom' => $projet->getNom(),
                    ];
                }, $client->getProjetsMariage()->toArray()),
            ];
        }, $clients);

        return $this->json(array_values($data));
    }

    // [AC-02] AFFICHER LE DÉTAIL D’UN CLIENT
    #[Route('/{id}', name: 'api_admin_clients_show', methods: ['GET'])]
    public function show(User $client): JsonResponse
    {
        if (!in_array('ROLE_CLIENT', $client->getRoles(), true)) {
            return $this->json([
                'success' => false,
                'error' => 'Cet utilisateur n’est pas un client.'
            ], 400);
        }

        return $this->json([
            'id' => $client->getId(),
            'email' => $client->getEmail(),
            'roles' => $client->getRoles(),
            'projetsMariage' => array_map(function ($projet) {
                return [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                    'dateMariage' => $projet->getDateMariage()?->format('Y-m-d H:i:s'),
                ];
            }, $client->getProjetsMariage()->toArray()),
        ]);
    }

    // [AC-03] CRÉER UN CLIENT
    #[Route('', name: 'api_admin_clients_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (
            !$data ||
            empty($data['email']) ||
            empty($data['password'])
        ) {
            return $this->json([
                'success' => false,
                'error' => 'Champs obligatoires manquants : email, password.'
            ], 400);
        }

        $existingUser = $entityManager->getRepository(User::class)->findOneBy([
            'email' => $data['email']
        ]);

        if ($existingUser) {
            return $this->json([
                'success' => false,
                'error' => 'Un utilisateur avec cet email existe déjà.'
            ], 400);
        }

        $client = new User();
        $client->setEmail($data['email']);
        $client->setRoles(['ROLE_CLIENT']);
        $client->setPassword(
            $passwordHasher->hashPassword($client, $data['password'])
        );

        $entityManager->persist($client);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Client créé avec succès.',
            'client' => [
                'id' => $client->getId(),
                'email' => $client->getEmail(),
                'roles' => $client->getRoles(),
            ]
        ], 201);
    }

    // [AC-04] METTRE À JOUR UN CLIENT
    #[Route('/{id}', name: 'api_admin_clients_update', methods: ['PATCH'])]
    public function update(
        Request $request,
        User $client,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        if (!in_array('ROLE_CLIENT', $client->getRoles(), true)) {
            return $this->json([
                'success' => false,
                'error' => 'Cet utilisateur n’est pas un client.'
            ], 400);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'error' => 'Données JSON invalides.'
            ], 400);
        }

        if (isset($data['email'])) {
            $existingUser = $entityManager->getRepository(User::class)->findOneBy([
                'email' => $data['email']
            ]);

            if ($existingUser && $existingUser->getId() !== $client->getId()) {
                return $this->json([
                    'success' => false,
                    'error' => 'Un utilisateur avec cet email existe déjà.'
                ], 400);
            }

            $client->setEmail($data['email']);
        }

        if (!empty($data['password'])) {
            $client->setPassword(
                $passwordHasher->hashPassword($client, $data['password'])
            );
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Client mis à jour avec succès.',
            'client' => [
                'id' => $client->getId(),
                'email' => $client->getEmail(),
                'roles' => $client->getRoles(),
            ]
        ]);
    }
}