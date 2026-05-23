<?php

/**
 * Contrôleur API client pour la gestion des documents.
 * Permet au client connecté de lister et ajouter des documents liés à ses projets.
 */

namespace App\Controller\Api;

use App\Entity\Document;
use App\Entity\ProjetMariage;
use App\Repository\DocumentRepository;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/client/documents')]
#[IsGranted('ROLE_CLIENT')]
final class ClientDocumentController extends AbstractController
{
    // [CD-01] LISTER LES DOCUMENTS DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_documents_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $documents = [];

        foreach ($user->getProjetsMariage() as $projet) {
            foreach ($projet->getDocuments() as $document) {
                $documents[] = [
                    'id' => $document->getId(),
                    'nomOriginal' => $document->getNomOriginal(),
                    'nomFichier' => $document->getNomFichier(),
                    'typeMime' => $document->getTypeMime(),
                    'taille' => $document->getTaille(),
                    'commentaireAdmin' => $document->getCommentaireAdmin(),
                    'url' => '/uploads/documents/' . $document->getNomFichier(),
                    'projetMariage' => [
                        'id' => $projet->getId(),
                        'nom' => $projet->getNom(),
                    ],
                ];
            }
        }

        return $this->json($documents);
    }

    // [CD-02] AJOUTER UN DOCUMENT AU PROJET DU CLIENT CONNECTÉ
    #[Route('', name: 'api_client_documents_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $projetMariageId = $request->request->get('projetMariageId');
        $uploadedFile = $request->files->get('fichier');

        if (!$projetMariageId || !$uploadedFile) {
            return $this->json([
                'success' => false,
                'error' => 'Champs obligatoires manquants : projetMariageId, fichier.'
            ], 400);
        }

        $projet = $entityManager->getRepository(ProjetMariage::class)->find($projetMariageId);

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

        $nomOriginal = $uploadedFile->getClientOriginalName();
        $extension = $uploadedFile->getClientOriginalExtension() ?: 'bin';
        $nomFichier = uniqid('doc_', true) . '.' . $extension;

        $taille = $uploadedFile->getSize() ?? 0;
        $typeMime = $uploadedFile->getClientMimeType() ?: 'application/octet-stream';

        try {
            $uploadedFile->move(
                $this->getParameter('kernel.project_dir') . '/public/uploads/documents',
                $nomFichier
            );
        } catch (FileException $e) {
            return $this->json([
                'success' => false,
                'error' => 'Erreur lors de l’upload du fichier.'
            ], 500);
        }

        $document = new Document();
        $document->setNomOriginal($nomOriginal);
        $document->setNomFichier($nomFichier);
        $document->setTypeMime($typeMime);
        $document->setTaille($taille);
        $document->setCommentaireAdmin(null);
        $document->setProjetMariage($projet);

        $entityManager->persist($document);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Document ajouté avec succès.',
            'document' => [
                'id' => $document->getId(),
                'nomOriginal' => $document->getNomOriginal(),
                'nomFichier' => $document->getNomFichier(),
                'typeMime' => $document->getTypeMime(),
                'taille' => $document->getTaille(),
                'commentaireAdmin' => $document->getCommentaireAdmin(),
                'url' => '/uploads/documents/' . $document->getNomFichier(),
                'projetMariage' => [
                    'id' => $projet->getId(),
                    'nom' => $projet->getNom(),
                ],
            ]
        ], 201);
    }

    // [CD-03] SUPPRIMER UN DOCUMENT DU PROJET DU CLIENT CONNECTÉ
    #[Route('/{id}', name: 'api_client_documents_delete', methods: ['DELETE'])]
    public function delete(
        int $id,
        DocumentRepository $documentRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $document = $documentRepository->find($id);

        if (!$document) {
            return $this->json([
                'success' => false,
                'error' => 'Document introuvable.'
            ], 404);
        }

        if (!$user->getProjetsMariage()->contains($document->getProjetMariage())) {
            return $this->json([
                'success' => false,
                'error' => 'Vous n’avez pas accès à ce document.'
            ], 403);
        }

        $cheminFichier = $this->getParameter('kernel.project_dir')
            . DIRECTORY_SEPARATOR . 'public'
            . DIRECTORY_SEPARATOR . 'uploads'
            . DIRECTORY_SEPARATOR . 'documents'
            . DIRECTORY_SEPARATOR . $document->getNomFichier();

        if (is_file($cheminFichier)) {
            if (!@unlink($cheminFichier)) {
                return $this->json([
                    'success' => false,
                    'error' => 'Impossible de supprimer le fichier physique.'
                ], 500);
            }
        }

        $entityManager->remove($document);
        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Document supprimé avec succès.'
        ]);
    }
}