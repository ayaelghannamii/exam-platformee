-- Création de la base de données
CREATE DATABASE IF NOT EXISTS exam_platform;
USE exam_platform;

-- Table utilisateur
CREATE TABLE IF NOT EXISTS utilisateur (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  birthDate DATE NOT NULL,
  gender ENUM('male', 'female') NOT NULL,
  establishment VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table examen
CREATE TABLE IF NOT EXISTS examen (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  targetAudience VARCHAR(255) NOT NULL,
  teacherId VARCHAR(36) NOT NULL,
  accessLink VARCHAR(36) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacherId) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table question
CREATE TABLE IF NOT EXISTS question (
  id VARCHAR(36) PRIMARY KEY,
  examId VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  type ENUM('direct', 'qcm') NOT NULL,
  answer TEXT,
  tolerance INT DEFAULT 0,
  multipleAnswers BOOLEAN DEFAULT FALSE,
  duration INT NOT NULL,
  points INT NOT NULL,
  attachmentType VARCHAR(50),
  attachmentUrl TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (examId) REFERENCES examen(id) ON DELETE CASCADE
);

-- Table option_question (pour les QCM)
CREATE TABLE IF NOT EXISTS option_question (
  id VARCHAR(36) PRIMARY KEY,
  questionId VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  isCorrect BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (questionId) REFERENCES question(id) ON DELETE CASCADE
);

-- Table tentative (attempts)
CREATE TABLE IF NOT EXISTS tentative (
  id VARCHAR(36) PRIMARY KEY,
  examId VARCHAR(36) NOT NULL,
  studentId VARCHAR(36) NOT NULL,
  startedAt TIMESTAMP NOT NULL,
  completedAt TIMESTAMP NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  currentQuestionIndex INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  FOREIGN KEY (examId) REFERENCES examen(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table reponse
CREATE TABLE IF NOT EXISTS reponse (
  id VARCHAR(36) PRIMARY KEY,
  tentativeId VARCHAR(36) NOT NULL,
  questionId VARCHAR(36) NOT NULL,
  textAnswer TEXT,
  isCorrect BOOLEAN NOT NULL DEFAULT FALSE,
  earnedPoints INT NOT NULL DEFAULT 0,
  submittedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (tentativeId) REFERENCES tentative(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES question(id) ON DELETE CASCADE
);

-- Table reponse_option (pour stocker les options sélectionnées dans les QCM)
CREATE TABLE IF NOT EXISTS reponse_option (
  id VARCHAR(36) PRIMARY KEY,
  reponseId VARCHAR(36) NOT NULL,
  optionId VARCHAR(36) NOT NULL,
  FOREIGN KEY (reponseId) REFERENCES reponse(id) ON DELETE CASCADE,
  FOREIGN KEY (optionId) REFERENCES option_question(id) ON DELETE CASCADE
);

-- Table geolocalisation
CREATE TABLE IF NOT EXISTS geolocalisation (
  id VARCHAR(36) PRIMARY KEY,
  tentativeId VARCHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tentativeId) REFERENCES tentative(id) ON DELETE CASCADE
);

-- Insertion de données de test
-- Utilisateurs
INSERT INTO utilisateur (id, email, password, firstName, lastName, birthDate, gender, establishment, department, role, createdAt)
VALUES
('1', 'prof@example.com', 'password123', 'Jean', 'Dupont', '1980-01-01', 'male', 'Université XYZ', 'Informatique', 'teacher', NOW()),
('2', 'etudiant@example.com', 'password123', 'Marie', 'Martin', '2000-01-01', 'female', 'Université XYZ', 'Informatique', 'student', NOW());

-- Examens
INSERT INTO examen (id, title, description, targetAudience, teacherId, accessLink, createdAt)
VALUES
('1', 'Introduction à la programmation', 'Concepts de base de la programmation', 'Étudiants en informatique - 1ère année', '1', 'prog101', NOW()),
('2', 'Bases de données relationnelles', 'Principes fondamentaux des bases de données SQL', 'Étudiants en informatique - 2ème année', '1', 'sql202', NOW()),
('3', 'Développement Web', 'HTML, CSS et JavaScript', 'Étudiants en informatique - 1ère année', '1', 'web101', NOW());

-- Questions
INSERT INTO question (id, examId, text, type, answer, tolerance, duration, points, createdAt)
VALUES
('1', '1', 'Qu''est-ce qu''une variable?', 'direct', 'Une zone mémoire qui stocke une valeur', 10, 60, 2, NOW()),
('2', '1', 'Quel est le résultat de 5 + 7 * 2?', 'direct', '19', 0, 30, 1, NOW()),
('3', '1', 'Lequel n''est pas un type de données primitif en JavaScript?', 'qcm', NULL, 0, 45, 1, NOW()),
('4', '2', 'Qu''est-ce qu''une clé primaire?', 'direct', 'Un attribut qui identifie de façon unique chaque enregistrement dans une table', 15, 60, 2, NOW()),
('5', '2', 'Quelles sont les commandes SQL de manipulation de données?', 'qcm', NULL, 0, 45, 2, NOW()),
('6', '3', 'Quelle balise HTML est utilisée pour créer un lien hypertexte?', 'direct', '<a>', 0, 30, 1, NOW()),
('7', '3', 'Lequel de ces sélecteurs CSS a la priorité la plus élevée?', 'qcm', NULL, 0, 45, 1, NOW());

-- Options pour les questions QCM
INSERT INTO option_question (id, questionId, text, isCorrect)
VALUES
('1', '3', 'Number', 0),
('2', '3', 'String', 0),
('3', '3', 'Array', 1),
('4', '3', 'Boolean', 0),
('5', '5', 'SELECT', 1),
('6', '5', 'INSERT', 1),
('7', '5', 'UPDATE', 1),
('8', '5', 'CREATE', 0),
('9', '7', 'Sélecteur d''élément (p, div)', 0),
('10', '7', 'Sélecteur de classe (.class)', 0),
('11', '7', 'Sélecteur d''ID (#id)', 1),
('12', '7', 'Sélecteur d''attribut ([attr])', 0);

-- Tentatives
INSERT INTO tentative (id, examId, studentId, startedAt, completedAt, completed, currentQuestionIndex, score)
VALUES
('1', '1', '2', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 30 MINUTE), 1, 3, 100),
('2', '3', '2', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 0, 1, 0);

-- Réponses
INSERT INTO reponse (id, tentativeId, questionId, textAnswer, isCorrect, earnedPoints, submittedAt)
VALUES
('1', '1', '1', 'Une zone mémoire qui stocke une valeur', 1, 2, DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 10 MINUTE)),
('2', '1', '2', '19', 1, 1, DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 20 MINUTE)),
('3', '1', '3', NULL, 1, 1, DATE_ADD(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 30 MINUTE)),
('4', '2', '6', '<a>', 1, 1, DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 5 MINUTE));

-- Options sélectionnées pour les réponses QCM
INSERT INTO reponse_option (id, reponseId, optionId)
VALUES
('1', '3', '3');

-- Géolocalisation
INSERT INTO geolocalisation (id, tentativeId, latitude, longitude, timestamp)
VALUES
('1', '1', 48.8566, 2.3522, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('2', '2', 48.8566, 2.3522, DATE_SUB(NOW(), INTERVAL 2 DAY));
