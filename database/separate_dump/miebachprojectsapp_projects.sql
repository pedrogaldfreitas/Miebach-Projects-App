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
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `client_name` varchar(100) DEFAULT NULL,
  `start_date` varchar(200) DEFAULT NULL,
  `end_date` varchar(200) DEFAULT NULL,
  `started` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ix_projects_client_name` (`client_name`),
  KEY `ix_projects_id` (`id`),
  KEY `ix_projects_end_date` (`end_date`),
  KEY `ix_projects_name` (`name`),
  KEY `ix_projects_start_date` (`start_date`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (5,'Project X','Landmark Cinemas','2025-10-21','2025-10-25',1),(6,'New Project','New Client','2025-10-14','2025-10-25',1),(7,'Newer Project','Newer Client','2025-10-22','2025-10-30',1),(8,'Newest Project','Pedro','2025-10-01','2025-10-15',1),(9,'Ultimate Project','Mercedes Benz','2025-10-20','2025-10-31',1),(10,'Final Project','Final Client','2025-10-14','2025-10-25',1),(11,'New World of Projects','Marvel','2025-10-22','2025-10-31',1),(12,'Joaos Project','Motorola','2025-10-14','2025-10-24',0),(13,'Another Project','twelvewest','2025-10-14','2025-10-25',0),(14,'New Prj','124124','2025-10-14','2025-10-25',0),(15,'Project ABC','Mysterious Client','2025-10-08','2025-12-17',1),(16,'PROJECT ABC2','ABC2','2025-10-15','2025-10-31',0),(17,'Project ABC3','No Client','2025-10-15','2025-10-24',0),(18,'Project ABC4','No Client','2025-10-01','2026-01-21',0);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-15 22:49:50
