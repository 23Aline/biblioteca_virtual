from django.db.models import Q, Count, F
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.db import IntegrityError
from django.contrib import messages
from .models import Livro, Leitor, Emprestimo, Devolucao
from django.utils import timezone
from datetime import date, datetime
import decimal
from django.views.decorators.http import require_POST 
from django.views.decorators.csrf import csrf_exempt

def home(request):
    
    query = request.GET.get('q')
    
    if query:
        
        livros = Livro.objects.filter(
            Q(titulo__icontains=query) |
            Q(autor__icontains=query) | 
            Q(genero__icontains=query)  
        ).distinct() 
    else:
        livros = Livro.objects.all()
    
    context = {
        'livros': livros
    }
    return render(request, 'home.html', context)

def livro_detalhes(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    
    emprestimos_ativos = Emprestimo.objects.filter(livro=livro, devolucao__isnull=True).count()
    disponivel = (livro.quantidade - emprestimos_ativos) > 0
    
    data_devolucao_proxima = None
    if not disponivel:
        emprestimos_pendentes = Emprestimo.objects.filter(livro=livro, devolucao__isnull=True).order_by('data_devolucao')
        if emprestimos_pendentes.exists():
            data_devolucao_proxima = emprestimos_pendentes.first().data_devolucao
    
    context = {
        'livro': livro,
        'disponivel': disponivel,
        'data_devolucao_proxima': data_devolucao_proxima
    }
    return render(request, 'livro_detalhes.html', context)

def cadastro_livros(request):
    if request.method == 'POST':
        Livro.objects.create(
            titulo=request.POST.get('titulo'),
            autor=request.POST.get('autor'),
            edicao=request.POST.get('edicao'),
            numero_paginas=request.POST.get('numero_paginas'),
            genero=request.POST.get('genero'),
            classificacao=request.POST.get('classificacao'),
            quantidade=request.POST.get('quantidade'),
            sinopse=request.POST.get('sinopse'),
            capa=request.FILES.get('capa') 
        )
        messages.success(request, 'Livro cadastrado com sucesso!')
        return redirect('home')
    
    context = {
        'quantidades': range(1, 51)
    }
    return render(request, 'cadastro_livros.html', context)

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
        messages.success(request, f'O livro "{livro.titulo}" foi atualizado.')
        return redirect('estoque')
    
    return redirect('estoque')

@require_POST
def excluir_livro(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    try:
        titulo_livro = livro.titulo
        livro.delete()
        messages.success(request, f'O livro "{titulo_livro}" foi excluído com sucesso.')
    except IntegrityError:
        messages.error(request, f'Não é possível excluir o livro "{livro.titulo}" pois ele está associado a um empréstimo.')
    
    return redirect('estoque')

def estoque(request):
    livros_cadastrados = Livro.objects.annotate(
        emprestados=Count('emprestimo', filter=Q(emprestimo__devolucao__isnull=True))
    ).annotate(
        disponiveis=F('quantidade') - F('emprestados') 
    )
    context = {
        'livros': livros_cadastrados
    }
    return render(request, 'estoque.html', context)

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
        novo_leitor.recebimento_alertas = 'recebimento_alertas' in request.POST
        novo_leitor.save()
        
        messages.success(request, 'Leitor cadastrado com sucesso!')
        return redirect('usuarios')
    
    return render(request, 'cadastro_leitor.html')

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
        messages.success(request, f'Dados de "{leitor.nome}" atualizados.')
        return redirect('usuarios')
    
    return redirect('usuarios')

@require_POST 
def excluir_leitor(request, leitor_id):
    leitor = get_object_or_404(Leitor, pk=leitor_id)
    try:
        nome_leitor = leitor.nome
        leitor.delete()
        messages.success(request, f'O leitor "{nome_leitor}" foi excluído com sucesso.')
    except IntegrityError:
        messages.error(request, f'Não é possível excluir o leitor "{leitor.nome}" pois ele possui empréstimos ativos.')
    return redirect('usuarios')

def usuarios(request):
    leitores = Leitor.objects.all()
    context = {
        'leitores': leitores
    }
    return render(request, 'usuarios.html', context)

def emprestimo(request):
    if request.method == 'POST':
        cpf = request.POST.get('cpf')
        titulo_livro = request.POST.get('livro')
        data_emprestimo_str = request.POST.get('data_emprestimo')
        data_devolucao_str = request.POST.get('data_devolucao')

        if not all([cpf, titulo_livro, data_emprestimo_str, data_devolucao_str]):
            messages.error(request, "Todos os campos são obrigatórios.", extra_tags="erro")
            return redirect('emprestimo')

        try:
            leitor = Leitor.objects.get(cpf=cpf)
            livro = Livro.objects.get(titulo=titulo_livro)
        except Leitor.DoesNotExist:
            messages.error(request, "Leitor não encontrado.", extra_tags="erro")
            return redirect('emprestimo')
        except Livro.DoesNotExist:
            messages.error(request, "Livro não encontrado.", extra_tags="erro")
            return redirect('emprestimo')

        emprestimos_ativos = Emprestimo.objects.filter(livro=livro, devolucao__isnull=True).count()
        if emprestimos_ativos >= livro.quantidade:
            messages.error(request, "Não há cópias disponíveis deste livro.", extra_tags="erro")
            return redirect('emprestimo')

        try:
            data_emprestimo_obj = datetime.strptime(data_emprestimo_str, '%Y-%m-%d').date()
            data_devolucao_obj = datetime.strptime(data_devolucao_str, '%Y-%m-%d').date()
        except ValueError:
            messages.error(request, "Formato de data inválido.", extra_tags="erro")
            return redirect('emprestimo')

        Emprestimo.objects.create(
            leitor=leitor,
            livro=livro,
            data_emprestimo=data_emprestimo_obj,
            data_devolucao=data_devolucao_obj
        )

        messages.success(request, "Empréstimo registrado com sucesso.", extra_tags="sucesso")
        return redirect('emprestimo')

    livros_cadastrados = Livro.objects.filter(quantidade__gt=0)
    return render(request, 'emprestimo.html', {'livros': livros_cadastrados})

def emprestimo_com_livro(request, livro_id):
    livro = get_object_or_404(Livro, pk=livro_id)
    livros_cadastrados = Livro.objects.all()
    
    emprestimos_ativos = Emprestimo.objects.filter(livro=livro, devolucao__isnull=True).count()
    if (livro.quantidade - emprestimos_ativos) <= 0:
        messages.error(request, f'O livro "{livro.titulo}" não está disponível para empréstimo no momento.')
        return redirect('livro_detalhes', livro_id=livro.id) 

    context = {
        'livro_pre_selecionado': livro,
        'livros': livros_cadastrados
    }
    return render(request, 'emprestimo.html', context)

def reservas(request):
    emprestimos_ativos = Emprestimo.objects.filter(devolucao__isnull=True).order_by('data_devolucao')
    hoje = date.today()

    for emprestimo in emprestimos_ativos:
        emprestimo.atrasado = emprestimo.data_devolucao < hoje

    context = {
        'emprestimos': emprestimos_ativos
    }
    return render(request, 'reservas.html', context)

def devolver_livro(request, emprestimo_id):
    emprestimo = get_object_or_404(Emprestimo, pk=emprestimo_id)
    if request.method == 'POST':
        data_entrega = date.fromisoformat(request.POST.get('data_entrega'))
        valor_multa_str = request.POST.get('valor_multa', '0.00')

        try:
            valor_multa = decimal.Decimal(valor_multa_str)
        except decimal.InvalidOperation:
            valor_multa = decimal.Decimal('0.00')

        Devolucao.objects.create(
            emprestimo=emprestimo,
            data_devolucao_real=data_entrega,
            valor_multa=valor_multa
        )
        
        messages.success(request, f'Devolução do livro "{emprestimo.livro.titulo}" registrada.')

        if valor_multa > 0:
            return redirect('multa')
        else:
            return redirect('reservas')
    return redirect('reservas')

def multa(request):
    devolucoes_com_multa = Devolucao.objects.filter(valor_multa__gt=0).order_by('-data_devolucao_real')
    context = {
        'devolucoes': devolucoes_com_multa
    }
    return render(request, 'multa.html', context)

def calcular_multa(request):
    emprestimo_id = request.GET.get('emprestimo_id')
    data_entrega_str = request.GET.get('data_entrega')

    try:
        emprestimo = get_object_or_404(Emprestimo, pk=emprestimo_id)
        data_entrega = datetime.strptime(data_entrega_str, '%Y-%m-%d').date()
        
        valor_multa = decimal.Decimal('0.00')
        atraso = False

        if data_entrega > emprestimo.data_devolucao:
            atraso = True
            dias_atraso = (data_entrega - emprestimo.data_devolucao).days
            valor_multa = decimal.Decimal(dias_atraso * 2.50) 
        
        return JsonResponse({'valor_multa': f'{valor_multa:.2f}', 'atraso': atraso})
    except Emprestimo.DoesNotExist:
        return JsonResponse({'erro': 'Empréstimo não encontrado'}, status=404)
    except Exception:
        return JsonResponse({'erro': 'Erro ao calcular multa.'}, status=500)

def buscar_leitor(request):
    cpf = request.GET.get('cpf', '').strip()
    if not cpf:
        return JsonResponse({'erro': 'CPF não fornecido'}, status=400)
    
    try:
        leitor = Leitor.objects.get(cpf=cpf)
        tem_multa = Emprestimo.objects.filter(
            leitor=leitor, devolucao__isnull=True, data_devolucao__lt=date.today()
        ).exists()
        
        return JsonResponse({'nome': leitor.nome, 'tem_multa': tem_multa})
    except Leitor.DoesNotExist:
        return JsonResponse({'erro': 'Leitor não encontrado'}, status=404)

def buscar_livro(request):
    titulo = request.GET.get('titulo')
    if not titulo:
        return JsonResponse({'erro': 'O título do livro não foi fornecido.'}, status=400)

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
    except Exception as e:
        
        return JsonResponse({'erro': str(e)}, status=500)

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
    
def buscar_livro_completo(request):
    titulo = request.GET.get('titulo')
    try:
        livro = Livro.objects.filter(titulo__icontains=titulo).first() 
        if not livro:
            return JsonResponse({'erro': 'Livro não encontrado'}, status=404)
        
       
        emprestimos_ativos = Emprestimo.objects.filter(livro=livro, devolucao__isnull=True).count()
        disponivel = (livro.quantidade - emprestimos_ativos) > 0

        data_devolucao_proxima = None
        if not disponivel:
            emprestimo_mais_proximo = Emprestimo.objects.filter(livro=livro, devolucao__isnull=True).order_by('data_devolucao').first()
            if emprestimo_mais_proximo and emprestimo_mais_proximo.data_devolucao:
                data_devolucao_proxima = emprestimo_mais_proximo.data_devolucao.strftime("%d/%m/%Y")

        response_data = {
            'disponivel': disponivel,
            'data_devolucao_proxima': data_devolucao_proxima,
            'titulo': livro.titulo,
            'autor': livro.autor,
            'edicao': livro.edicao,
            'numero_paginas': livro.numero_paginas,
            'genero': livro.genero,
            'classificacao': livro.classificacao,
            'capa': livro.capa.url if livro.capa else None
        }
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'erro': str(e)}, status=500)