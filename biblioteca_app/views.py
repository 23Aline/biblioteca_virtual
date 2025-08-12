import json
from django.db.models import Q, Count, F
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404 
from django.db import IntegrityError 
from django.contrib import messages
from .models import Livro, Leitor, Emprestimo

def home(request):
    livros = Livro.objects.all()
    
    context = {
        'livros': livros
    }

    return render(request, 'home.html', context)

def reservas(request):
    return render(request, 'reservas.html')

def multa(request):
    return render(request, 'multa.html')

def cadastro_livros(request):
    if request.method == 'POST':
        novo_livro = Livro()
        
        novo_livro.titulo = request.POST.get('titulo')
        novo_livro.autor = request.POST.get('autor')
        novo_livro.edicao = request.POST.get('edicao')
        novo_livro.numero_paginas = request.POST.get('numero_paginas')
        novo_livro.genero = request.POST.get('genero')
        novo_livro.classificacao = request.POST.get('classificacao')
        novo_livro.quantidade = request.POST.get('quantidade')
        novo_livro.sinopse = request.POST.get('sinopse')
        
        if 'capa' in request.FILES:
            novo_livro.capa = request.FILES['capa']
    
        novo_livro.save()
        
        return redirect('home')
    
    context = {
        'quantidades': range(1, 51)
    }

    return render(request, 'cadastro_livros.html', context)

def cadastro_leitor(request):
    if request.method == 'POST':
        novo_leitor = Leitor()
        novo_leitor.nome = request.POST.get('nome')
        novo_leitor.data_nascimento = request.POST.get('data_nascimento')
        novo_leitor.celular = request.POST.get('celular')
        novo_leitor.cpf = request.POST.get('cpf')
        novo_leitor.email = request.POST.get('email')
        novo_leitor.cep = request.POST.get('cep')
        novo_leitor.endereco = request.POST.get('endereco')
        novo_leitor.complemento = request.POST.get('complemento')
        novo_leitor.cidade = request.POST.get('cidade')
        novo_leitor.recebimento_alertas = request.POST.get('recebimento_alertas')
        novo_leitor.save()

        return redirect('usuarios')
    
    return render(request, 'cadastro_leitor.html')

def emprestimo(request):
    livros_cadastrados = Livro.objects.all()
    context = {'livros': livros_cadastrados}

    if request.method == 'POST':
        cpf = request.POST.get('cpf')
        titulo_livro = request.POST.get('livro')
        data_emprestimo = request.POST.get('data_emprestimo')

        try:
            leitor = Leitor.objects.get(cpf=cpf)
            livro = Livro.objects.get(titulo=titulo_livro)

            emprestimos_ativos = Emprestimo.objects.filter(livro=livro, data_devolucao__isnull=True).count()
            if emprestimos_ativos >= livro.quantidade:
                context['erro'] = "Não há cópias disponíveis deste livro para empréstimo."
                return render(request, 'emprestimo.html', context)

            novo_emprestimo = Emprestimo(
                leitor=leitor,
                livro=livro,
                data_emprestimo=data_emprestimo,
            )
            novo_emprestimo.save()
            return redirect('home')
        except (Leitor.DoesNotExist, Livro.DoesNotExist):
            context['erro'] = "Leitor ou Livro não encontrados."
            return render(request, 'emprestimo.html', context)
    
    return render(request, 'emprestimo.html', context)

def buscar_leitor(request):
    cpf = request.GET.get('cpf')
    try:
        leitor = Leitor.objects.get(cpf=cpf)
        tem_multa = False 
        
        response_data = {
            'nome': leitor.nome,
            'tem_multa': tem_multa
        }
        return JsonResponse(response_data)
    except Leitor.DoesNotExist:
        return JsonResponse({'erro': 'Leitor não encontrado'}, status=404)

def buscar_livro(request):
    titulo = request.GET.get('titulo')
    try:
        livro = Livro.objects.filter(titulo__icontains=titulo).first() 
        
        if livro:
            response_data = {
                'titulo': livro.titulo,
                'autor': livro.autor,
                'edicao': livro.edicao,
                'numero_paginas': livro.numero_paginas,
                'genero' : livro.genero,
                'classificacao' : livro.classificacao,
                'capa': livro.capa.url if livro.capa else None
            }
            return JsonResponse(response_data)
        else:
            return JsonResponse({'erro': 'Livro não encontrado'}, status=404)
            
    except Livro.DoesNotExist:
        return JsonResponse({'erro': 'Livro não encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)
    
def livro_detalhes(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    
    emprestimos_ativos = Emprestimo.objects.filter(livro=livro, data_devolucao__isnull=True).count()
    disponivel = (livro.quantidade - emprestimos_ativos) > 0
    
    data_devolucao_proxima = None
    if not disponivel:
        emprestimo_mais_proximo = Emprestimo.objects.filter(livro=livro, data_devolucao__isnull=True).order_by('data_devolucao').first()
        if emprestimo_mais_proximo:
            data_devolucao_proxima = emprestimo_mais_proximo.data_devolucao
            
    context = {
        'livro': livro,
        'disponivel': disponivel,
        'data_devolucao_proxima': data_devolucao_proxima
    }
    return render(request, 'livro_detalhes.html', context)

def emprestimo_com_livro(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    livros_cadastrados = Livro.objects.all()
    
    emprestimos_ativos = Emprestimo.objects.filter(livro=livro, data_devolucao__isnull=True).count()
    disponivel = (livro.quantidade - emprestimos_ativos) > 0

    if not disponivel:
        return redirect('livro_detalhes', livro_id=livro.id) 

    context = {
        'livro_pre_selecionado': livro,
        'livros': livros_cadastrados
    }
    return render(request, 'emprestimo.html', context)

def estoque(request):
    livros_cadastrados = Livro.objects.annotate(
        emprestados=Count('emprestimo', filter=Q(emprestimo__data_devolucao__isnull=True))
    ).annotate(
        disponiveis=F('quantidade') - F('emprestados') 
    )
    context = {
        'livros': livros_cadastrados
    }
    return render(request, 'estoque.html', context)

def editar_livro(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    if request.method == 'POST':
        livro.titulo = request.POST.get('titulo-edicao')
        livro.autor = request.POST.get('autor-edicao')
        livro.edicao = request.POST.get('edicao-edicao')
        livro.numero_paginas = request.POST.get('numero_paginas-edicao')
        livro.genero = request.POST.get('genero-edicao')
        livro.classificacao = request.POST.get('classificacao-edicao')
        livro.quantidade = request.POST.get('quantidade-edicao')
        livro.sinopse = request.POST.get('sinopse-edicao')
        
        if 'capa-nova-edicao' in request.FILES:
            livro.capa = request.FILES['capa-nova-edicao']
            
        livro.save()
        return redirect('estoque')
    
    return redirect('estoque')

def excluir_livro(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    try:
        if request.method == 'GET':
            livro.delete()
            messages.success(request, f'O livro "{livro.titulo}" foi excluído com sucesso.')
            return redirect('estoque')
    except IntegrityError:
        messages.error(request, f'Não é possível excluir o livro "{livro.titulo}" pois ele está associado a um empréstimo ativo.')
        return redirect('estoque')
    
    return redirect('estoque')

def buscar_leitor_por_id(request):
    leitor_id = request.GET.get('id')
    
    try:
        leitor = Leitor.objects.get(pk=leitor_id)
        
        response_data = {
            'nome': leitor.nome,
            'celular': leitor.celular,
            'email': leitor.email,
            'cep': leitor.cep,
            'endereco': leitor.endereco,
            'complemento': leitor.complemento or '', 
            'cidade': leitor.cidade,
        }
        return JsonResponse(response_data)
    except Leitor.DoesNotExist:
        return JsonResponse({'erro': 'Leitor não encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)

def usuarios(request):
    leitores = Leitor.objects.all()
    context = {
        'leitores': leitores
    }
    return render(request, 'usuarios.html', context)

def editar_leitor(request, leitor_id):
    leitor = get_object_or_404(Leitor, pk=leitor_id)
    if request.method == 'POST':
        leitor.nome = request.POST.get('nome-edicao')
        leitor.celular = request.POST.get('celular-edicao')
        leitor.email = request.POST.get('email-edicao')
        leitor.cep = request.POST.get('cep-edicao')
        leitor.endereco = request.POST.get('endereco-edicao')
        leitor.complemento = request.POST.get('complemento-edicao')
        leitor.cidade = request.POST.get('cidade-edicao')
        leitor.save()
        return redirect('usuarios')
    return JsonResponse({'error': 'Método não permitido'}, status=405)

def excluir_leitor(request, leitor_id):
    leitor = get_object_or_404(Leitor, pk=leitor_id)
    try:
        if request.method == 'GET':
            leitor.delete()
            messages.success(request, f'O leitor "{leitor.nome}" foi excluído com sucesso.')
    except IntegrityError:
        messages.error(request, f'Não é possível excluir o leitor "{leitor.nome}" pois ele está associado a empréstimos ativos.')
    return redirect('usuarios')

def buscar_livro_por_id(request):
    livro_id = request.GET.get('id')
    
    try:
        livro = Livro.objects.get(pk=livro_id)
        
        response_data = {
            'titulo': livro.titulo,
            'autor': livro.autor,
            'genero': livro.genero,
            'classificacao': livro.classificacao,
            'quantidade': livro.quantidade,
            'edicao': livro.edicao,
            'numero_paginas': livro.numero_paginas,
            'sinopse': livro.sinopse,
            'capa_url': livro.capa.url if livro.capa else None
        }
        return JsonResponse(response_data)
    except Livro.DoesNotExist:
        return JsonResponse({'erro': 'Livro não encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)