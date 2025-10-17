-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: miebachprojectsapp
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phase_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `start_date` varchar(200) DEFAULT NULL,
  `end_date` varchar(200) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `budget` int DEFAULT NULL,
  `due_date` varchar(200) DEFAULT NULL,
  `actual_spend` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_tasks_start_date` (`start_date`),
  KEY `ix_tasks_budget` (`budget`),
  KEY `ix_tasks_id` (`id`),
  KEY `ix_tasks_end_date` (`end_date`),
  KEY `ix_tasks_phase_id` (`phase_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,17,'gdsgsdfg','fsdgsdfgsdfgsdfg','2025-10-14','2025-10-25','Not Started',23542,'2025-10-15',0),(2,17,'Second Task','tutu','2025-10-01','2025-10-15','Not Started',235,'2025-10-23',0),(3,17,'Third Task','task 3','2025-10-07','2025-10-31','Not Started',253,'2025-10-22',16608),(4,25,'First Phase','firstphase description','2025-10-22','2025-10-16','Not Started',1234,'2025-10-23',0),(5,26,'New Task','Desc','2025-10-13','2025-10-31','Not Started',4000,'2025-10-14',0),(6,11,'blah blah','grsgdffg','2025-10-15','2025-10-22','Not Started',34500,'2025-12-24',0),(7,28,'Website Redesign','Website Redesign','2025-10-15','2025-10-22','Not Started',2000,'2025-10-22',1600),(8,29,'First task of First phase','no desc.','2025-10-15','2025-10-31','Not Started',3000,'2025-10-23',2800),(9,29,'Second Task of First Phase','23132','2025-10-14','2025-10-23','Not Started',3200,'2025-10-22',800),(10,19,'New Task','task test','2025-10-07','2025-10-22','Not Started',345,'2025-10-08',0);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-15 22:49:49
