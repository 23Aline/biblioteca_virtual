document.addEventListener('DOMContentLoaded', function () {

    function toggleMenu() {
        const menu = document.getElementById('side-menu');
        if (menu) menu.classList.toggle('active');
    }
    window.toggleMenu = toggleMenu;

    const urlEmprestimo = window.urlEmprestimo || '/';

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        const enderecoInput = document.getElementById('endereco-edicao') || document.getElementById('endereco');
        const cidadeInput = document.getElementById('cidade-edicao') || document.getElementById('cidade');

        cepInput.addEventListener('blur', () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(res => res.json())
                    .then(data => {
                        if (!data.erro) {
                            enderecoInput.value = `${data.logradouro}, ${data.bairro}`;
                            cidadeInput.value = `${data.localidade} - ${data.uf}`;
                        } else {
                            alert('CEP não encontrado.');
                            enderecoInput.value = '';
                            cidadeInput.value = '';
                        }
                    })
                    .catch(() => {
                        alert('Erro ao buscar o CEP.');
                        enderecoInput.value = '';
                        cidadeInput.value = '';
                    });
            }
        });
    }

    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        const leitorNomeDisplay = document.getElementById('leitor-nome');
        const multaInfoDisplay = document.getElementById('multa-info');

        cpfInput.addEventListener('blur', () => {
            const cpf = cpfInput.value.replace(/\D/g, '');
            if (cpf.length === 11) {
                fetch(`/api/leitor/buscar/?cpf=${cpf}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.erro) throw new Error(data.erro);
                        leitorNomeDisplay.innerText = data.nome;
                        multaInfoDisplay.innerText = data.tem_multa ? 'Possui multa por atraso' : 'Não possui multas';
                    })
                    .catch(error => {
                        leitorNomeDisplay.innerText = error.message;
                        multaInfoDisplay.innerText = 'N/A';
                        console.error('Erro:', error);
                    });
            } else {
                leitorNomeDisplay.innerText = '';
                multaInfoDisplay.innerText = '';
            }
        });
    }

    const livroBuscaInput = document.getElementById('livro-busca');
    if (livroBuscaInput) {
        const livroCapaDisplay = document.getElementById('livro-capa');
        const livroTituloDisplay = document.getElementById('livro-titulo');
        const livroAutorDisplay = document.getElementById('livro-autor');
        const livroEdicaoDisplay = document.getElementById('livro-edicao');
        const livroNumeroPaginasDisplay = document.getElementById('livro-numero_paginas');
        const livroGeneroDisplay = document.getElementById('livro-genero');
        const livroClassificacaoDisplay = document.getElementById('livro-classificacao');
        const modalIndisponivel = document.getElementById('modal-livro-indisponivel');
        const mensagemIndisponivel = document.getElementById('mensagem-indisponivel');

        function fecharModal() { modalIndisponivel.style.display = 'none'; }
        modalIndisponivel.querySelectorAll('.fechar-modal, .btn-voltar-modal').forEach(btn => {
            btn.addEventListener('click', fecharModal);
        });
        window.addEventListener('click', (e) => { if (e.target === modalIndisponivel) fecharModal(); });

        livroBuscaInput.addEventListener('change', () => {
            const tituloBusca = livroBuscaInput.value;
            if (tituloBusca) {
                fetch(`/api/livro/completo/?titulo=${encodeURIComponent(tituloBusca)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.erro) throw new Error(data.erro);

                        livroCapaDisplay.src = data.capa || '';
                        livroCapaDisplay.style.display = data.capa ? 'block' : 'none';
                        livroTituloDisplay.innerText = data.titulo;
                        livroAutorDisplay.innerText = data.autor;
                        livroEdicaoDisplay.innerText = `Edição: ${data.edicao}`;
                        livroNumeroPaginasDisplay.innerText = `Páginas: ${data.numero_paginas}`;
                        livroGeneroDisplay.innerText = `Gênero: ${data.genero}`;
                        livroClassificacaoDisplay.innerText = `Classificação: ${data.classificacao}`;

                        if (!data.disponivel) {
                            let msg = "Livro indisponível.";
                            if (data.data_devolucao_proxima) msg += ` Data mais próxima de devolução: ${data.data_devolucao_proxima}`;
                            mensagemIndisponivel.innerText = msg;
                            modalIndisponivel.style.display = 'block';
                        }
                    })
                    .catch(error => {
                        alert(error.message);
                        livroCapaDisplay.style.display = 'none';
                        livroTituloDisplay.innerText = 'Livro não encontrado.';
                        livroAutorDisplay.innerText = '';
                        livroEdicaoDisplay.innerText = '';
                        livroNumeroPaginasDisplay.innerText = '';
                        livroGeneroDisplay.innerText = '';
                        livroClassificacaoDisplay.innerText = '';
                    });
            }
        });
    }

    const limparBtn = document.querySelector('.btn-limpar');
    if (limparBtn) {
        limparBtn.addEventListener('click', () => {
            const form = document.getElementById('form-emprestimo');
            form.reset();
            ['leitor-nome', 'multa-info', 'livro-capa', 'livro-titulo', 'livro-autor', 'livro-edicao', 'livro-numero_paginas', 'livro-genero', 'livro-classificacao'].forEach(id => {
                const el = document.getElementById(id);
                if (el.tagName === 'IMG') { el.src = ''; el.style.display = 'none'; }
                else el.innerText = '';
            });
        });
    }

    const modalSucesso = document.getElementById("modal-sucesso");
    const modalErro = document.getElementById("modal-erro");

    if (modalSucesso) {
        const mensagemSucesso = modalSucesso.querySelector("#mensagem-sucesso").textContent.trim();
        if (mensagemSucesso) {
            modalSucesso.style.display = "block";
        }
    }

    if (modalErro) {
        const mensagemErro = modalErro.querySelector("#mensagem-erro").textContent.trim();
        if (mensagemErro) {
            modalErro.style.display = "block";
        }
    }

    document.querySelectorAll(".fechar-modal-sucesso, .btn-fechar-modal-sucesso").forEach(function (btn) {
        btn.addEventListener("click", function () {
            modalSucesso.style.display = "none";
        });
    });

    const btnsEditarLeitor = document.querySelectorAll(".btn-editar[data-leitor-id]");
    const modalEdicaoLeitor = document.getElementById("modal-edicao-leitor");
    const fecharModalLeitor = modalEdicaoLeitor?.querySelector(".fechar-modal");
    const btnVoltarLeitor = modalEdicaoLeitor?.querySelector(".btn-voltar-modal");

    btnsEditarLeitor.forEach(btn => {
        btn.addEventListener("click", (event) => {
            const tr = event.target.closest("tr");

            document.getElementById("leitor-id-edicao").value = tr.dataset.leitorId;
            document.getElementById("nome-edicao").value = tr.dataset.nome || '';
            document.getElementById("celular-edicao").value = tr.dataset.celular || '';
            document.getElementById("email-edicao").value = tr.dataset.email || '';
            document.getElementById("cep-edicao").value = tr.dataset.cep || '';
            document.getElementById("endereco-edicao").value = tr.dataset.endereco || '';
            document.getElementById("complemento-edicao").value = tr.dataset.complemento || '';
            document.getElementById("cidade-edicao").value = tr.dataset.cidade || '';

            const form = document.getElementById("form-edicao-leitor");
            form.action = `/usuarios/editar/${tr.dataset.leitorId}/`;

            modalEdicaoLeitor.style.display = "block";
        });
    });

    [fecharModalLeitor, btnVoltarLeitor].forEach(el => {
        el?.addEventListener("click", () => {
            modalEdicaoLeitor.style.display = "none";
        });
    });

    window.addEventListener("click", e => {
        if (e.target === modalEdicaoLeitor) {
            modalEdicaoLeitor.style.display = "none";
        }
    });

    const btnsEditarLivro = document.querySelectorAll(".btn-editar:not([data-leitor-id])");
    const modalEdicaoLivro = document.getElementById("modal-edicao");
    const btnFecharLivro = modalEdicaoLivro?.querySelector(".fechar-modal");
    const btnVoltarLivro = modalEdicaoLivro?.querySelector(".btn-voltar-modal");

    btnsEditarLivro.forEach(btn => {
        btn.addEventListener("click", (event) => {
            const tr = event.target.closest("tr");
            const livroId = tr.dataset.livroId;

            document.getElementById("livro-id-edicao").value = livroId;
            document.getElementById("titulo-edicao").value = tr.dataset.livroTitulo || "";
            document.getElementById("autor-edicao").value = tr.dataset.autor || "";
            document.getElementById("genero-edicao").value = tr.dataset.genero || "";
            document.getElementById("edicao-edicao").value = tr.dataset.edicao || "";
            document.getElementById("numero_paginas-edicao").value = tr.dataset.numeroPaginas || "";
            document.getElementById("classificacao-edicao").value = tr.dataset.classificacao || "";
            document.getElementById("sinopse-edicao").value = tr.dataset.sinopse || "";
            document.getElementById("capa-preview").src = tr.dataset.capa || "";
            document.getElementById("quantidade-edicao").value = tr.dataset.quantidade || 0;

            const form = document.getElementById("form-edicao");
            form.action = `/editar_livro/${livroId}/`;

            modalEdicaoLivro.style.display = "block";
        });
    });

    [btnFecharLivro, btnVoltarLivro].forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                modalEdicaoLivro.style.display = "none";
            });
        }
    });

    window.addEventListener("click", e => {
        if (e.target === modalEdicaoLivro) {
            modalEdicaoLivro.style.display = "none";
        }
    });

    const btnsDevolucao = document.querySelectorAll(".btn-devolucao");
    const modalDevolucao = document.getElementById("modal-devolucao");
    const fecharModalDevolucao = modalDevolucao?.querySelector(".fechar-modal");
    const btnVoltarDevolucao = modalDevolucao?.querySelector(".btn-voltar-modal");

    btnsDevolucao.forEach(btn => {
        btn.addEventListener("click", () => {
            const tr = btn.closest("tr");
            const emprestimoId = btn.dataset.emprestimoId;

            document.getElementById("emprestimo-id").value = emprestimoId;
            document.getElementById("titulo-devolucao").textContent = tr.children[0].textContent;
            document.getElementById("leitor-devolucao").textContent = tr.children[1].textContent;
            document.getElementById("data-emprestimo-devolucao").textContent = tr.dataset.emprestimoData;
            document.getElementById("data-devolucao-prevista").textContent = tr.children[2].textContent;
            document.getElementById("atrasado-devolucao").textContent = tr.children[3].textContent;

            const form = document.getElementById("form-devolucao");
            form.action = `/reservas/devolver/${emprestimoId}/`;

            document.getElementById("data-entrega").value = "";
            document.getElementById("valor-multa").textContent = "0.00";
            document.getElementById("valor-multa-hidden").value = "0.00";

            modalDevolucao.style.display = "block";
        });
    });

    [fecharModalDevolucao, btnVoltarDevolucao].forEach(el => {
        el?.addEventListener("click", () => {
            modalDevolucao.style.display = "none";
        });
    });

    window.addEventListener("click", e => {
        if (e.target === modalDevolucao) {
            modalDevolucao.style.display = "none";
        }
    });

    const dataEntregaInput = document.getElementById("data-entrega");
    dataEntregaInput?.addEventListener("change", () => {
        const emprestimoId = document.getElementById("emprestimo-id").value;
        const dataEntrega = dataEntregaInput.value;

        if (emprestimoId && dataEntrega) {
            fetch(`/calcular_multa/?emprestimo_id=${emprestimoId}&data_entrega=${dataEntrega}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.erro) {
                        document.getElementById("valor-multa").textContent = data.valor_multa;
                        document.getElementById("valor-multa-hidden").value = data.valor_multa;
                        document.getElementById("atrasado-devolucao").textContent = data.atraso ? "Sim" : "Não";
                    }
                });
        }
    });

    const formDevolucao = document.getElementById("form-devolucao");
    formDevolucao?.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(formDevolucao);
        fetch(formDevolucao.action, {
            method: 'POST',
            body: formData
        })
            .then(res => {
                if (res.redirected) {
                    alert("Devolução concluída!");
                    window.location.href = res.url; 
                }
            })
            .catch(err => console.error(err));
    });

});
