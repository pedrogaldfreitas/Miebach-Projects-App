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
-- Table structure for table `project_phases`
--

DROP TABLE IF EXISTS `project_phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_phases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `phase_name` varchar(100) DEFAULT NULL,
  `start_date` varchar(200) DEFAULT NULL,
  `end_date` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_project_phases_project_id` (`project_id`),
  KEY `ix_project_phases_start_date` (`start_date`),
  KEY `ix_project_phases_end_date` (`end_date`),
  KEY `ix_project_phases_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_phases`
--

LOCK TABLES `project_phases` WRITE;
/*!40000 ALTER TABLE `project_phases` DISABLE KEYS */;
INSERT INTO `project_phases` VALUES (7,1,'Development','2025-10-19','2025-10-29'),(8,1,'Planning','2025-10-21','2025-10-19'),(9,4,'First Phase of Project','2025-10-07','2025-10-17'),(10,4,'TEST PHASE','2025-10-28','2025-10-31'),(11,5,'Testing','2025-10-21','2025-10-31'),(12,5,'Development','2025-11-02','2025-10-18'),(13,5,'Third Phase','2025-10-14','2025-10-24'),(14,7,'Testing','2025-10-01','2025-10-07'),(15,7,'Development','2025-10-08','2025-10-17'),(16,7,'Production','2025-10-21','2025-10-29'),(17,6,'First Phase','2025-10-07','2025-10-18'),(18,6,'Second Phase','2025-10-21','2025-10-18'),(19,9,'Phase One','2025-10-08','2025-10-30'),(20,9,'Phase Two','2025-10-14','2025-10-22'),(21,10,'1','2025-10-02','2025-10-15'),(22,8,'Phase 1','2025-10-07','2025-10-23'),(23,11,'New Phase','2025-10-01','2025-10-24'),(24,11,'Newer Phase','2025-10-21','2025-10-31'),(25,13,'First Phase','2025-10-08','2025-10-31'),(26,14,'First Phase','2025-10-08','2025-10-15'),(27,14,'Testing','2025-10-21','2025-10-30'),(28,15,'Design','2025-10-23','2025-10-30'),(29,16,'Phase 1','2025-10-07','2025-10-24');
/*!40000 ALTER TABLE `project_phases` ENABLE KEYS */;
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
