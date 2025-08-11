from django.db import models

class Livro(models.Model):
    titulo = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)
    edicao = models.CharField(max_length=100)
    numero_paginas = models.IntegerField()
    genero = models.CharField(max_length=50)
    classificacao = models.IntegerField() 
    quantidade = models.IntegerField()
    sinopse = models.TextField()
    capa = models.ImageField(upload_to='capas/', blank=True, null=True)

    def __str__(self):
        return self.titulo

class Leitor(models.Model):
    nome = models.CharField(max_length=200)
    data_nascimento = models.DateField()
    celular = models.CharField(max_length=15)
    cpf = models.CharField(max_length=14, unique=True)
    email = models.EmailField(unique=True)
    cep = models.CharField(max_length=9)
    endereco = models.CharField(max_length=255)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100)
    recebimento_alertas = models.CharField(max_length=10, choices=[('email', 'Email'), ('celular', 'Celular')], default='email')

    def __str__(self):
        return self.nome
    
class Emprestimo(models.Model):
    leitor = models.ForeignKey(Leitor, on_delete=models.CASCADE)
    livro = models.ForeignKey(Livro, on_delete=models.CASCADE)
    data_emprestimo = models.DateField()
    data_devolucao = models.DateField(null=True, blank=True) 
    multa_paga = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.leitor.nome} emprestou {self.livro.titulo}"
    
class Leitores(models.Model):
    nome = models.CharField(max_length=200)
    data_nascimento = models.DateField()
    celular = models.CharField(max_length=15, unique=True)
    cpf = models.CharField(max_length=14, unique=True)
    email = models.EmailField(unique=True)
    cep = models.CharField(max_length=9)
    endereco = models.CharField(max_length=255)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100)
    recebimento_alertas = models.BooleanField(default=True)

    @property
    def possui_multa(self):
        return Emprestimo.objects.filter(leitor=self, multa_paga=False).exists()

    def __str__(self):
        return self.nome